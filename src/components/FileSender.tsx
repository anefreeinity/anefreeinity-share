import React, { useRef } from "react";
import Peer from "peerjs";

interface FileSenderProps {
  peer: Peer;
}

const FileSender: React.FC<FileSenderProps> = ({ peer }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        const arrayBuffer = reader.result as ArrayBuffer;

        const uint8Array = new Uint8Array(arrayBuffer);

        const fileDataToSend = {
          file: uint8Array,
          name: file.name,
        };

        const connections = peer.connections;
        const conn = Object.values(connections)[0]?.[0];

        if (conn) {
          conn.send(fileDataToSend);
          console.log("File sent successfully!");
        } else {
          console.error("No active connection found.");
        }
      };
      reader.readAsArrayBuffer(file);
    }
  };

  return (
    <div>
      <h2>Send File</h2>
      <input type="file" ref={fileInputRef} onChange={handleFileChange} />
    </div>
  );
};

export default FileSender;
