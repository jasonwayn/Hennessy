// src/components/ConfirmModal.jsx
function ConfirmModal({ isOpen, title, description, onConfirm, onCancel }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-lg p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-3">{title}</h2>
        {description && (
          <p className="text-sm text-gray-600 mb-6 whitespace-pre-line">{description}</p>
        )}
        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded border border-gray-300 text-gray-700 hover:bg-gray-100 transition"
          >
            취소
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700 transition"
          >
            확인
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmModal;
