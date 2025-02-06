import React, { useEffect, useState } from "react";
import Peer, { DataConnection } from "peerjs";
import FileSender from "./file-sender";
import FileReceiver from "./file-receiver";
import RequestDialog from "./request-dialog";

const Home: React.FC = () => {
  const [peer, setPeer] = useState<Peer | null>(null);
  const [peerId, setPeerId] = useState<string>("");
  const [remotePeerId, setRemotePeerId] = useState<string>("");
  const [connected, setConnected] = useState(false);
  const [dataConnection, setDataConnection] = useState<DataConnection | null>(
    null
  );
  const [showModal, setShowModal] = useState(false);
  const [isInitiator, setIsInitiator] = useState(false);

  const generateRandomPin = () => {
    const min = 1000;
    const max = 9999;

    const randomNumber = Math.floor(Math.random() * (max - min + 1)) + min;
    return randomNumber.toString();
  };

  useEffect(() => {
    const randomPin = generateRandomPin();
    const newPeer = new Peer(randomPin);

    newPeer.on("open", (id) => {
      setPeerId(id);
    });

    newPeer.on("connection", (conn) => {
      setDataConnection(conn);
      setShowModal(true);
      setIsInitiator(false);

      handleConnectionEvents(conn);
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
      setDataConnection(conn);
      setIsInitiator(true);

      handleConnectionEvents(conn, true);
    }
  };

  const handleConnectionEvents = (conn: DataConnection, isSender = false) => {
    conn.on("open", () => {
      console.log("Connection opened");
      isSender && setConnected(true);
      isSender && setShowModal(false);
    });

    conn.on("data", (data: any) => {
      console.log("Received data:", data);
    });

    conn.on("close", () => {
      setConnected(false);
      setDataConnection(null);
    });

    conn.on("error", (err: any) => {
      console.error("Connection error:", err);
      setConnected(false);
      setDataConnection(null);
    });
  };

  const acceptCall = () => {
    if (dataConnection) {
      setConnected(true);
      setShowModal(false);
    }
  };

  const rejectCall = () => {
    if (dataConnection) {
      dataConnection.close();
      setDataConnection(null);
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
    <div
      className={`bg-slate-800 w-screen h-screen flex flex-col justify-center items-center`}
    >
      {!connected && (
        <div
          className={`bg-slate-900 w-10/12 h-1/4 md:w-1/3 md:h-1/3 flex flex-col rounded-xl
            justify-center items-center gap-12`}
        >
          <div className="flex text-2xl gap-4">
            <p className="text-gray-300 font-light">Peer ID </p>
            <p className="text-purple-400 font-bold">{peerId}</p>
          </div>
          <div className="flex flex-col gap-6">
            <input
              className={`rounded-lg mx-auto px-4 py-2 font-semibold text-xl bg-gray-950 border-2
                border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-400
                w-36 text-gray-200`}
              type="text"
              placeholder="Peer ID"
              value={remotePeerId}
              onChange={(e) => setRemotePeerId(e.target.value)}
            />
            <button
              className={`bg-gray-600 px-4 py-2 mx-auto rounded-lg hover:bg-gray-700 text-gray-200 
                border border-transparent hover:border-purple-400 focus:outline-none 
                focus:ring-2 focus:ring-purple-400`}
              onClick={connectToPeer}
            >
              Connect
            </button>
          </div>
        </div>
      )}

      {showModal && dataConnection && (
        <RequestDialog
          caller={dataConnection.peer}
          isOpen={showModal}
          onClose={rejectCall}
          onConfirm={acceptCall}
        />
      )}

      {connected && dataConnection && (
        <>
          <FileSender connection={dataConnection} isInitiator={isInitiator} />
          <FileReceiver connection={dataConnection} isInitiator={isInitiator} />
        </>
      )}
    </div>
  );
};

export default Home;
