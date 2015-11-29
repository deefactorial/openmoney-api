// Definite our Divider Event Emitter
var events = require('events')
var Divider = function(){
    events.EventEmitter.call(this)
}
require('util').inherits(Divider, events.EventEmitter)

// Add the divide function
Divider.prototype.divide = function(x,y){
    // if error condition?
    if ( y === 0 ) {
        // "throw" the error safely by emitting it
        var err = new Error("Can't divide by zero")
        this.emit('error', err)
    }
    else {
        // no error occured, continue on
        this.emit('divided', x, y, x/y)
    }

    // Chain
    return this;
}

// Create our divider and listen for errors
var divider = new Divider()
divider.on('error', function(err){
    // handle the error safely
    console.log(err)
})
divider.on('divided', function(x,y,result){
    console.log(x+'/'+y+'='+result)
})

// Divide
divider.divide(4,2).divide(4,0)