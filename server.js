const express = require('express')
const app = express()
let http = require('http').Server(app)
let io = require('socket.io')(http)

const PORT = process.env.PORT || 7000

app.use(express.static('public'))

http.listen(PORT, ()=>{
    console.log(`Server started on port ${PORT}`)
})
let num = 0
/* Event Listeners */
io.on('connection', socket =>{
    console.log('A user just connected')

    socket.on('create or join', room =>{
        console.log('Create or join the room ', room)
        const myRoom = io.sockets.adapter.rooms[room] || {length : 0}
        const numClients = myRoom.length
        console.log(io.sockets.adapter.rooms)
       
        console.log(`${room} has ${num} clients`)

        if(num == 0){            
            console.log(`Emittd the created event`)
            socket.join(room)
            socket.emit('created', room)
            num ++            
        }else if(num == 1){
            console.log(`Emitted the join Event`)
            socket.join(room)
            socket.emit('joined', room)
        }else{
            console.log(`Emitted the "Full" event`)
            socket.emit('full', room)
        }
    })

    socket.on('ready', room =>{
        socket.broadcast.to(room).emit('ready')
    })

    // socket.on('ready', room =>{
    //     socket.broadcast.to(room).emit('ready')
    // })
    
    socket.on('candidate', event =>{
        socket.broadcast.to(event.room).emit('candidate', event)
    })

    socket.on('offer', event =>{
        socket.broadcast.to(event.room).emit('offer', event.sdp)
    })

    socket.on('answer', event =>{
        socket.broadcast.to(event.room).emit('answer', event.sdp)
        num = 0
    })
})