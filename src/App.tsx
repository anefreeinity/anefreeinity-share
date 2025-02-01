// App.tsx
import React, { useEffect, useRef, useState } from "react";
import Peer from "peerjs";
import FileSender from "./components/FileSender";
import FileReceiver from "./components/FileReceiver";
import { QRCodeSVG } from "qrcode.react";
import QrScanner from "qr-scanner";

const App: React.FC = () => {
  const [peer, setPeer] = useState<Peer | null>(null);
  const [peerId, setPeerId] = useState<string>("");
  const [remotePeerId, setRemotePeerId] = useState<string>("");
  const [connected, setConnected] = useState(false);
  const [incomingCall, setIncomingCall] = useState<Peer.DataConnection | null>(
    null
  );
  const [showModal, setShowModal] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [videoReady, setVideoReady] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const qrScanner = useRef<QrScanner | null>(null);

  useEffect(() => {
    const newPeer = new Peer();

    newPeer.on("open", (id) => {
      setPeerId(id);
    });

    if (videoRef.current) {
      // Check if videoRef is set
      setVideoReady(true); // Set videoReady to true when it is
    }

    newPeer.on("connection", (conn) => {
      // Incoming connection request
      setIncomingCall(conn);
      setShowModal(true);

      conn.on("open", () => {
        setConnected(true);
      });

      conn.on("data", (data) => {
        console.log("Received data:", data);
      });

      conn.on("close", () => {
        setConnected(false);
        setIncomingCall(null);
      });

      conn.on("error", (err) => {
        console.error("Connection error:", err);
        setConnected(false);
        setIncomingCall(null);
      });
    });

    setPeer(newPeer);

    return () => {
      if (peer) {
        peer.destroy();
      }
      if (qrScanner.current) {
        qrScanner.current.destroy(); // Destroy the scanner on unmount
      }
    };
  }, []);

  const connectToPeer = () => {
    if (peer && remotePeerId) {
      const conn = peer.connect(remotePeerId);

      conn.on("open", () => {
        setConnected(true);
        setIncomingCall(null);
      });

      conn.on("data", (data) => {
        console.log("Received data:", data);
      });

      conn.on("close", () => {
        setConnected(false);
      });

      conn.on("error", (err) => {
        console.error("Connection error:", err);
        setConnected(false);
      });
    }
  };

  const startScan = async () => {
    if (!videoReady) return;
    setScanning(true);
    try {
      qrScanner.current = new QrScanner(
        videoRef.current!, // The video element
        (result) => {
          // The onDecode callback
          setRemotePeerId(result.data); // Access data property of the result
          setScanning(false);
          connectToPeer();
          qrScanner.current?.stop();
        },
        {
          // The QrScanner configuration object
          // ... other QrScanner options if needed (e.g., errorCorrectionLevel)
        }
      );

      await qrScanner.current.start();
    } catch (error) {
      console.error("Error starting scan:", error);
      setScanning(false);
    }
  };

  const stopScan = () => {
    if (qrScanner.current) {
      qrScanner.current.stop();
      setScanning(false);
    }
  };

  const acceptCall = () => {
    if (incomingCall) {
      setConnected(true);
      setShowModal(false);
      // No need to do anything else, the 'connection' event handler
      // will take care of the rest. Just update the state.
    }
  };

  const rejectCall = () => {
    if (incomingCall) {
      incomingCall.close(); // Or conn.close() if you have the connection object
      setIncomingCall(null);
      setShowModal(false);
    }
  };

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue =
        "Your upload is still in progress. Are you sure you want to leave?";
    };

    if (connected) {
      window.addEventListener("beforeunload", handleBeforeUnload);
    }

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [connected]);

  return (
    <div>
      <h1>File Sharing App</h1>
      <p>Your Peer ID: {peerId}</p>
      {peerId && ( // Only show QR code if peerId is available
        <div className="qr-code-container">
          <QRCodeSVG value={peerId} size={128} level="H" title={peerId} />{" "}
          {/* Adjust size as needed */}
        </div>
      )}
      {!connected && !scanning && (
        <button onClick={startScan} disabled={!videoReady}>
          {" "}
          {/* Disable if video not ready */}
          Start Scan
        </button>
      )}
      <video ref={videoRef} style={{ width: 300, height: 300 }}></video>

      {scanning && (
        <div>
          <button onClick={stopScan}>Stop Scan</button>
        </div>
      )}
      {!connected && ( // Only show connection UI if not connected
        <>
          <input
            type="text"
            placeholder="Remote Peer ID"
            value={remotePeerId}
            onChange={(e) => setRemotePeerId(e.target.value)}
          />
          <button onClick={connectToPeer}>Connect</button>
        </>
      )}

      {showModal && ( // Conditionally render the modal
        <div className="modal">
          <div className="modal-content">
            <p>Incoming call from {incomingCall?.peer}</p>{" "}
            {/* Optional chaining */}
            <button onClick={acceptCall}>Accept</button>
            <button onClick={rejectCall}>Reject</button>
          </div>
        </div>
      )}

      {peer && (
        <>
          <FileSender peer={peer} />
          <FileReceiver peer={peer} />
        </>
      )}
    </div>
  );
};

export default App;
