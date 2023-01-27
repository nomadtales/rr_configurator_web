// function getMousePos(canvas, event) {
//     var rect = canvas.getBoundingClientRect();
//     return {
//         x: event.clientX - rect.left,
//         y: event.clientY - rect.top
//     };
// }

// function isInside(pos, rect) {
//     return pos.x > rect.x && pos.x < rect.x + rect.width && pos.y < rect.y + rect.heigth && pos.y > rect.y
// }

// var canvas = document.getElementById('myCanvas');
// var context = canvas.getContext('2d');

// var img = new Image();
// img.onload = start;
// img.src = "./images/Xbox_Controller.svg";

// // Do drawing in function to force draw order
// function start() {
//     /// initial draw of image
//     context.drawImage(img, 0, 0, img.width * 1.3, img.height * 1.3)

//     context.beginPath();
//     context.rect(250, 350, 200, 100);
//     context.fillStyle = '#FFFFFF';
//     context.fillStyle = 'rgba(225,225,225,0.5)';
//     context.fillRect(250, 350, 200, 100);
//     context.fill();
//     context.lineWidth = 2;
//     context.strokeStyle = '#000000';
//     context.stroke();
//     context.closePath();
//     context.font = '40pt Kremlin Pro Web';
//     context.fillStyle = '#000000';
//     context.fillText('Start', 345, 415);
// }


// canvas.addEventListener('click', function(evt) {
//     var mousePos = getMousePos(canvas, evt);

//     if (isInside(mousePos, rect)) {
//         alert('clicked inside rect');
//     } else {
//         SendDeviceConfigRequest();
//         //alert('clicked outside rect');
//     }
// }, false);