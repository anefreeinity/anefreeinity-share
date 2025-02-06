import { DataConnection } from "peerjs";
import React, { useRef, useState } from "react";

interface IFileSenderProps {
  connection: DataConnection;
  isInitiator: boolean;
}

const CHUNK_SIZE = 256 * 1024;

const FileSender: React.FC<IFileSenderProps> = ({
  connection,
  isInitiator,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [progress, setProgress] = useState<number>(0);

  const formatFileSize = (size: number) => {
    if (size >= 1024 * 1024 * 1024) {
      return `${(size / (1024 * 1024 * 1024)).toFixed(2)} GB`;
    } else if (size >= 1024 * 1024) {
      return `${(size / (1024 * 1024)).toFixed(2)} MB`;
    } else {
      return `${(size / 1024).toFixed(2)} KB`;
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && connection && isInitiator) {
      setSelectedFile(file);
      sendFile(file);
    }
  };

  const sendFile = async (file: File) => {
    setIsSending(true);
    setProgress(0);

    const reader = new FileReader();
    let offset = 0;
    let totalChunks = Math.ceil(file.size / CHUNK_SIZE);

    const sendChunk = () => {
      if (offset >= file.size) {
        connection.send({ done: true });
        setIsSending(false);
        return;
      }

      const chunk = file.slice(offset, offset + CHUNK_SIZE);
      reader.readAsArrayBuffer(chunk);
    };

    reader.onload = () => {
      const uint8Array = new Uint8Array(reader.result as ArrayBuffer);

      connection.send({
        fileChunk: uint8Array,
        name: file.name,
        size: file.size,
        chunkIndex: Math.floor(offset / CHUNK_SIZE),
        totalChunks: totalChunks,
      });

      offset += CHUNK_SIZE;
      setProgress((offset / file.size) * 100);

      sendChunk();
    };

    connection.send({
      start: true,
      name: file.name,
      size: file.size,
      type: file.type,
      totalChunks,
    });
    sendChunk();
  };

  if (!isInitiator) return null;

  return (
    <div className="flex w-10/12 md:w-2/5 flex-col gap-4 bg-slate-900 p-4 rounded-xl">
      <h2 className="text-2xl text-gray-200 font-bold font-sans">Send File</h2>

      <div className="flex flex-col gap-2">
        <div className="flex text-lg gap-2">
          <p className="text-gray-300 font-light">My Peer ID:</p>
          <p className="text-purple-400 font-bold">{connection.provider.id}</p>
        </div>
        <div className="flex text-lg gap-2">
          <p className="text-gray-300 font-light">Remote Peer ID:</p>
          <p className="text-purple-400 font-bold">{connection.peer}</p>
        </div>
      </div>

      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        onChange={handleFileChange}
      />

      <button
        className="bg-purple-500 hover:bg-purple-600 text-white font-semibold py-2 px-4 rounded-lg mx-auto"
        onClick={() => fileInputRef.current?.click()}
      >
        Select File
      </button>

      {selectedFile && (
        <div className="mt-4 p-3 bg-gray-800 rounded-lg">
          <p className="text-gray-300 text-sm">📁 {selectedFile.name}</p>
          <p className="text-gray-400 text-xs">
            {formatFileSize(selectedFile.size)}
          </p>

          {isSending && (
            <div className="mt-2 flex gap-2">
              <div className="w-full bg-gray-700 rounded-md h-2 relative">
                <div
                  className="bg-purple-500 h-2 rounded-md transition-all duration-200"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-gray-300 text-xs mt-1">
                {progress.toFixed(0)}%
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default FileSender;
