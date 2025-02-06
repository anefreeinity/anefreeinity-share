interface IRequestDialogProps {
  caller: string;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

const RequestDialog: React.FC<IRequestDialogProps> = ({
  caller = "Unknown",
  isOpen,
  onClose,
  onConfirm,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-slate-800 p-6 rounded-lg shadow-lg w-96">
        <h2 className="text-xl font-bold font-sans text-purple-400">
          Incoming Call..!
        </h2>
        <div className="flex font-sans mt-2 gap-1">
          <p className="text-sky-400">{caller}</p>
          <p className="text-gray-300">wants to connect with you.</p>
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <button
            className={`px-4 py-2 bg-blue-600 rounded-lg hover:bg-blue-700 text-gray-200`}
            onClick={onConfirm}
          >
            Accept
          </button>
          <button
            className={`px-4 py-2 text-gray-200 bg-red-600 rounded-lg hover:bg-red-700`}
            onClick={onClose}
          >
            Decline
          </button>
        </div>
      </div>
    </div>
  );
};

export default RequestDialog;
