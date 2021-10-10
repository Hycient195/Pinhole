const selectRoom = document.querySelector('#selectRoom')
const consultingRoom = document.querySelector('#consultingRoom')
const inputRoomNumber = document.querySelector('#roomNumber')
const goButton = document.querySelector('#goRoom')
const localVideo = document.querySelector('#localVideo')
const remoteVideo = document.querySelector('#remoteVideo')

let roomNumber, localStream, remoteStream, rtcStream, rtcPeerConnection, isCaller

const iceServers = {
    'iceServer' : [
        {'urls' : 'stun:stun.services.mozilla.com'},
        {'urls' : 'stun:stun.l.google.com:19302'}
    ]
}
const streamConstraints = {
    audio : true,
    video : true
}

const socket = io()

goButton.onclick = () =>{
    if(inputRoomNumber.value === ''){
        alert('Please enter a room name')
    }else{
       roomNumber = inputRoomNumber.value
       socket.emit('create or join', roomNumber)
       selectRoom.style.display = "none"
    }
}

// socket.on('created', room =>{
//     navigator.mediaDevices.getUserMedia(streamConstraints)
//         .then(stream =>{
//             localStream = stream
//             localVideo.srcObject = stream
//             isCaller = true
//         })
//         .catch(err =>{
//             console.log(`An error occored ${err}`)
//         })
// })

socket.on('created', room =>{
    navigator.mediaDevices.getUserMedia({
        audio : true,
        video : { facingMode : 'user'}
    })
        .then(stream =>{
            localStream = stream
            localVideo.srcObject = stream
            isCaller = true
        })
        .catch(err =>{
            console.log(`An error occored ${err}`)
        })
})


socket.on('joined', room =>{
    navigator.mediaDevices.getUserMedia(streamConstraints)
        .then(stream =>{
            localStream = stream
            localVideo.srcObject = stream
            socket.emit('ready', roomNumber)
        })
        .catch(err =>{
            console.log(`An error ocoured ${err}`)
        })
})

socket.on('ready', (event)=>{
    console.log(`Emitted the ready event`)
    if(isCaller){
        rtcPeerConnection = new RTCPeerConnection(iceServers)
        rtcPeerConnection.onicecandidate = onIceCandidate
        rtcPeerConnection.ontrack = onAddStream
        rtcPeerConnection.addTrack(localStream.getTracks()[0], localStream)
        rtcPeerConnection.addTrack(localStream.getTracks()[1], localStream)
        rtcPeerConnection.createOffer()
            .then(sessionDescription =>{
                rtcPeerConnection.setLocalDescription(sessionDescription)
                socket.emit('offer', {
                    type : 'offer',
                    sdp : sessionDescription,
                    room : roomNumber
                })
            })
            .catch(err =>{
                console.log(`An error ocoured ${err}`)
            })
    }
})

socket.on('offer', function(event){
    console.log(`Emitted the offer event`)
    if(!isCaller){
        rtcPeerConnection = new RTCPeerConnection(iceServers)
        rtcPeerConnection.onicecandidate = onIceCandidate
        rtcPeerConnection.ontrack = onAddStream
        rtcPeerConnection.addTrack(localStream.getTracks()[0], localStream)
        rtcPeerConnection.addTrack(localStream.getTracks()[1], localStream)
        rtcPeerConnection.setRemoteDescription(new RTCSessionDescription(event))
        rtcPeerConnection.createAnswer()
            .then(sessionDescription =>{
                console.log(`Sending offer ${sessionDescription}`)
                rtcPeerConnection.setLocalDescription(sessionDescription)
                socket.emit('answer', {
                    type : 'answer',
                    sdp : sessionDescription,
                    room : roomNumber
                })
            })
            .catch(err =>{
                console.log(`An error ocoured ${err}`)
            })
    }
})

socket.on('answer', event =>{
    console.log('Recieved answer')
    rtcPeerConnection.setRemoteDescription(new RTCSessionDescription(event))
})

socket.on('candidate', event =>{
    const candidate = new RTCIceCandidate({
        sdpMLineIndex : event.label,
        candidate : event.candidate
    })
    console.log(`Recieved candidate ${candidate}`)
    rtcPeerConnection.addIceCandidate(candidate)
})

function onAddStream(event){
    remoteVideo.srcObject = event.streams[0]
    remoteStream = event.streams[0] 
}

function onIceCandidate(event){
    console.log(`Sending Ice Candidate ${event.candidate}`)
    socket.emit('candidate',{
        type : 'candidate',
        label : event.candidate.sdpMLineIndex,
        id : event.candidate.sdpMid,
        candidate : event.candidate.candidate,
        room : roomNumber
    })
} 

// navigator.mediaDevices.getUserMedia(streamConstraints)
// .then(stream =>{
//     localStream = stream
//     localVideo.srcObject = stream
// })
// .catch(err =>{
//     console.log('An error occoured', err)
// })
// selectRoom.style.display = "none"