import { DataConnection } from "peerjs";
import React, { useEffect, useState } from "react";

interface IFileReceiverProps {
  connection: DataConnection;
  isInitiator: boolean;
}

const FileReceiver: React.FC<IFileReceiverProps> = ({
  connection,
  isInitiator,
}) => {
  const [receivedChunks, setReceivedChunks] = useState<Uint8Array[]>([]);
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileSize, setFileSize] = useState<number | null>(null);
  const [progress, setProgress] = useState<number>(0);
  const [totalChunks, setTotalChunks] = useState<number>(0);
  const [receivedChunksCount, setReceivedChunksCount] = useState<number>(0);
  const [fileBlob, setFileBlob] = useState<Blob | null>(null);

  useEffect(() => {
    const handleData = (data: any) => {
      if (data.start) {
        console.log(data.name);
        setFileName(data.name);
        setFileSize(data.size);
        setTotalChunks(data.totalChunks);
        setReceivedChunks([]);
        setReceivedChunksCount(0);
        setProgress(0);
        setFileBlob(null);
      } else if (data.fileChunk) {
        setReceivedChunks((prevChunks) => [...prevChunks, data.fileChunk]);
        setReceivedChunksCount((prevCount) => {
          const newCount = prevCount + 1;
          setProgress((newCount / totalChunks) * 100);
          return newCount;
        });

        if (receivedChunksCount + 1 === totalChunks) {
          const completeFile = new Blob([...receivedChunks]);
          setFileBlob(completeFile);
        }
      }
    };

    if (connection && !isInitiator) {
      connection.on("data", handleData);
      return () => {
        connection.off("data", handleData);
      };
    }
  }, [
    connection,
    isInitiator,
    receivedChunksCount,
    totalChunks,
    receivedChunks,
  ]);

  const formatFileSize = (size: number) => {
    if (size >= 1024 * 1024 * 1024) {
      return `${(size / (1024 * 1024 * 1024)).toFixed(2)} GB`;
    } else if (size >= 1024 * 1024) {
      return `${(size / (1024 * 1024)).toFixed(2)} MB`;
    } else {
      return `${(size / 1024).toFixed(2)} KB`;
    }
  };

  const downloadFile = () => {
    if (!fileBlob || !fileName) return;
    const url = URL.createObjectURL(fileBlob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (isInitiator) return null;

  return (
    <div className="flex flex-col gap-4 bg-slate-900 p-4 rounded-xl w-80">
      <h2 className="text-2xl text-gray-200 font-bold font-sans">
        Receive File
      </h2>

      {!fileName ? (
        <p className="text-gray-400 text-sm">Waiting for a file...</p>
      ) : (
        <div className="mt-4 p-3 bg-gray-800 rounded-lg">
          <p className="text-gray-300 text-sm">📁 {fileName}</p>
          <p className="text-gray-400 text-xs">
            {formatFileSize(fileSize || 0)}
          </p>

          {progress < 100 ? (
            <div className="mt-2">
              <div className="w-full bg-gray-700 rounded-md h-2 relative">
                <div
                  className="bg-green-500 h-2 rounded-md transition-all duration-200"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-gray-300 text-xs mt-1 text-center">
                {progress.toFixed(0)}%
              </p>
            </div>
          ) : (
            fileBlob && (
              <button
                onClick={downloadFile}
                className="mt-3 bg-blue-500 text-white px-4 py-2 rounded-lg w-full text-sm font-semibold hover:bg-blue-600 transition"
              >
                Download File
              </button>
            )
          )}
        </div>
      )}
    </div>
  );
};

export default FileReceiver;
