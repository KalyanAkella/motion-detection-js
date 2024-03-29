function MotionSystem(_video, _canvasSource, _canvasBlended) {
  var video = _video;
  var canvasSource = _canvasSource;
  var canvasBlended = _canvasBlended;
  var contextSource = canvasSource.getContext('2d');
  var contextBlended = canvasBlended.getContext('2d');
  var lastImageData = null;
  var previousWhiteArea = null;
  contextSource.translate(canvasSource.width, 0);
  contextSource.scale(-1, 1);

  this.start = function () {
    function drawVideo() {
      contextSource.drawImage(video, 0, 0, video.width, video.height);
    }

    function blend() {
      var width = canvasSource.width;
      var height = canvasSource.height;
      var sourceData = contextSource.getImageData(width - 200, height - 200, 200, 200);
      if (!lastImageData) lastImageData = contextSource.getImageData(width - 200, height - 200, 200, 200);
      var blendedData = contextSource.createImageData(200, 200);
      differenceAccuracy(blendedData.data, sourceData.data, lastImageData.data);
      contextBlended.putImageData(blendedData, 0, 0);
      lastImageData = sourceData;

      //contextBlended.strokeStyle = "#FF0000";
      //contextBlended.strokeRect(width - 200, height - 200, 200, 200);
    }

    function fastAbs(value) {
      // equivalent to Math.abs();
      return (value ^ (value >> 31)) - (value >> 31);
    }

    function threshold(value) {
      return (value > 21) ? 0xFF : 0;
    }

    function differenceAccuracy(target, data1, data2) {
      if (data1.length != data2.length) return null;
      var i = 0;
      while (i < (data1.length * 0.25)) {
        var index = 4 * i++;
        var average1 = (data1[index] + data1[index+1] + data1[index+2]) / 3;
        var average2 = (data2[index] + data2[index+1] + data2[index+2]) / 3;
        var diff = threshold(fastAbs(average1 - average2));
        target[index] = diff;
        target[index+1] = diff;
        target[index+2] = diff;
        target[index+3] = 255;
      }
    }

    function checkAreas() {
      var width = canvasSource.width;
      var height = canvasSource.height;
      var blendedDataHolder = contextBlended.getImageData(0, 0, width, height);
      var blendedData = blendedDataHolder.data;
      var whiteArea = 0, i = 0;
      var limit = blendedData.length * 0.25;
      while (i < limit) {
        var index = 4 * i++;
        whiteArea += blendedData[index] & 1;
      }
      if (previousWhiteArea && previousWhiteArea < whiteArea) {
        $("#white-report").text("Scrolling up");
      } else if (previousWhiteArea && previousWhiteArea > whiteArea) {
        $("#white-report").text("Scrolling down");
      } else if (whiteArea == 0) {
        $("#white-report").text("no motion");
      }
      $("#prev-white-area").text(previousWhiteArea);
      $("#curr-white-area").text(whiteArea);
      previousWhiteArea = whiteArea;
    }

    function update() {
      drawVideo();
      blend();
      //checkAreas();
      setTimeout(update, 1000/60);
    }

    update();
  };
}

function webcamError(e) {
  alert('Webcam error!', e);
};

function initialise() {
  var video = $('#webcam')[0];
  if (navigator.getUserMedia) {
    navigator.getUserMedia({audio: false, video: true}, function(stream) {
      video.src = stream;
      video.muted = 'muted';
    }, webcamError);
  } else if (navigator.webkitGetUserMedia) {
      navigator.webkitGetUserMedia({audio: false, video: true}, function(stream) {
        video.src = window.webkitURL.createObjectURL(stream);
        video.muted = 'muted';
    }, webcamError);
  } else {
    //video.src = 'video.webm'; // fallback.
  }

  var canvasSource = $("#canvas-source")[0];
  var canvasBlended = $("#canvas-blended")[0];
  var motionSystem = new MotionSystem(video, canvasSource, canvasBlended);
  motionSystem.start();
}
