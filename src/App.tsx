import React, { useEffect, useState } from "react";
import Peer from "peerjs";
import FileSender from "./components/FileSender";
import FileReceiver from "./components/FileReceiver";

const App: React.FC = () => {
  const [peer, setPeer] = useState<Peer | null>(null);
  const [peerId, setPeerId] = useState<string>("");
  const [remotePeerId, setRemotePeerId] = useState<string>("");
  const [connected, setConnected] = useState(false);
  const [incomingCall, setIncomingCall] = useState<Peer.DataConnection | null>(
    null
  );
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const newPeer = new Peer();

    newPeer.on("open", (id) => {
      setPeerId(id);
    });

    newPeer.on("connection", (conn) => {
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

  const acceptCall = () => {
    if (incomingCall) {
      setConnected(true);
      setShowModal(false);
    }
  };

  const rejectCall = () => {
    if (incomingCall) {
      incomingCall.close();
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
      {!connected && (
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

      {showModal && (
        <div className="modal">
          <div className="modal-content">
            <p>Incoming call from {incomingCall?.peer}</p>{" "}
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
