// src/components/AlertModal.jsx
function AlertModal({ isOpen, title, description, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-md w-full max-w-sm p-6">
        <h2 className="text-lg font-bold mb-2">{title}</h2>
        {description && <p className="text-sm text-gray-700 mb-4">{description}</p>}
        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            확인
          </button>
        </div>
      </div>
    </div>
  );
}

export default AlertModal;
