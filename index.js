'use strict';

let connection,
    sendChannel,
    receiveChannel,
    pcConstraint,
    dataConstraint,
    isSecond;

'use strict';

window.addEventListener('storage', (event) => {
    if (event.key == "second") {
        let remoteDescr = JSON.parse(event.newValue)
        connection.setRemoteDescription(remoteDescr)
    } else if (event.key == "first_candidate") {
        console.log("Got first candidate")
        let cnd = JSON.parse(event.newValue)
        let candidate = new RTCIceCandidate({
            sdpMLineIndex: cnd.label,
            candidate: cnd.candidate
        });
        connection.addIceCandidate(candidate);
    } else if (event.key == "second_candidate") {
        console.log("Got second candidate")
        let cnd = JSON.parse(event.newValue)
        let candidate = new RTCIceCandidate({
            sdpMLineIndex: cnd.label,
            candidate: cnd.candidate
        });
        connection.addIceCandidate(candidate);
    }
})

const createConnection = () => {
    let servers = null;
    pcConstraint = null;
    dataConstraint = null;

    // local
    connection = new RTCPeerConnection(servers, pcConstraint)
    if (!localStorage.getItem("first")) {
        sendChannel = connection.createDataChannel('sendDataChannel', dataConstraint)
        sendChannel.onopen = () => {
            console.log("Send Channel Openned")
            setInterval(() => {
                console.log("SEND DATA")
                sendChannel.send("TIME: " + Date.now())
            }, 1000)
        }
        sendChannel.onclose = () => console.log("Send Channel Closed")
        sendChannel.onmessage = (e) => console.log("Received message: ", e.data)
    }
    
    connection.onicecandidate = iceCallback;
    connection.ondatachannel = receiveChannelCallback;

    if (localStorage.getItem("first")) {
        isSecond = true
        let remoteDesc = JSON.parse(localStorage.getItem("first"))
        connection.setRemoteDescription(remoteDesc)
        connection.createAnswer().then(desc => {
            console.log("createAnswer")
            connection.setLocalDescription(desc)
            localStorage.setItem("second", JSON.stringify(desc.toJSON()))
        })

    } else {
        connection.createOffer().then(
            (desc) => {
                console.log("createOffer")
                connection.setLocalDescription(desc);
                localStorage.setItem("first", JSON.stringify(desc.toJSON()))
            }
        )
    }
}

const iceCallback = (event) => {
    if (event.candidate) {
        if (localStorage.getItem("first_candidate")) {
            console.log("Paste second candidate")
            const first = JSON.parse(localStorage.getItem("first_candidate"))
            localStorage.setItem("second_candidate", JSON.stringify({
                type: 'candidate',
                label: event.candidate.sdpMLineIndex,
                id: event.candidate.sdpMid,
                candidate: event.candidate.candidate
            }))
            console.log("Receive first candidate")
            connection.addIceCandidate(new RTCIceCandidate({
                candidate: first.candidate
            }))
        } else {
            console.log("Paste first candidate")
            localStorage.setItem("first_candidate", JSON.stringify({
                type: 'candidate',
                label: event.candidate.sdpMLineIndex,
                id: event.candidate.sdpMid,
                candidate: event.candidate.candidate
            }))
        }
    }
}

const receiveChannelCallback = (event) => {
    if (isSecond) {
        receiveChannel = event.channel;
        receiveChannel.onmessage = (event) => console.log("Received message: ", event.data)
        receiveChannel.onclose = () => console.log("Receive Channel Closed")
        receiveChannel.onopen = () => {
            console.log("Receive Channel Openned")
            setInterval(() => {
                console.log("REPLY DATA")
                receiveChannel.send("RANDOM: " + Math.round(Math.random()*100))
            }, 1000)
        }
    }
}

createConnection();
