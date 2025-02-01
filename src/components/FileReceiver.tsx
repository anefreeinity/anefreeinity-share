import React, { useState, useEffect } from "react";
import Peer from "peerjs";

interface FileReceiverProps {
  peer: Peer;
}

const FileReceiver: React.FC<FileReceiverProps> = ({ peer }) => {
  const [receivedFile, setReceivedFile] = useState<Blob | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  useEffect(() => {
    const handleData = (data: unknown) => {
      console.log("Receiver is called");
      if (
        typeof data === "object" &&
        data !== null &&
        "file" in data &&
        "name" in data
      ) {
        const fileData = data.file;
        const name = data.name as string;

        if (fileData instanceof Uint8Array) {
          const blob = new Blob([fileData]);
          setReceivedFile(blob);
          name && setFileName(name);
        }
      }
    };

    peer.on("connection", (conn) => {
      conn.on("data", handleData);
    });

    return () => {
      peer.off("connection", handleData);
    };
  }, [peer]);

  const downloadFile = () => {
    if (receivedFile && fileName) {
      const url = URL.createObjectURL(receivedFile);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  return (
    <div>
      <h2>Received File</h2>
      {receivedFile ? (
        <button onClick={downloadFile}>Download {fileName}</button>
      ) : (
        <p>No file received yet.</p>
      )}
    </div>
  );
};

export default FileReceiver;
