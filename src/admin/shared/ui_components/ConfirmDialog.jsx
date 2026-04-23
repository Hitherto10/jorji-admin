import Modal from './Modal'
import Button from './Button'

export default function ConfirmDialog({ isOpen, onClose, onConfirm, title, message }) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div className="px-6 py-4">
        <p className="text-gray-300 text-sm">{message}</p>
      </div>
      <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-700">
        <Button onClick={onClose} variant="secondary">
          Cancel
        </Button>
        <Button onClick={onConfirm} variant="danger">
          Confirm
        </Button>
      </div>
    </Modal>
  )
}
