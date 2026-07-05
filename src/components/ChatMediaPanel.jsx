import { FaCamera, FaImages, FaSpinner } from 'react-icons/fa';
import { isNative } from '../utils/platform';

/**
 * WhatsApp-style media actions for chat: gallery and camera.
 */
export default function ChatMediaPanel({
  mediaUploading = false,
  onChooseFromDevice,
  onTakePhoto,
}) {
  const cameraLabel = isNative() ? 'Take Photo' : 'Take Photo / Webcam';

  return (
    <div className="px-4 py-3 border-t border-gray-200 bg-white">
      {mediaUploading && (
        <div className="mb-3 flex items-center gap-2 rounded-lg bg-green-50 px-3 py-2 text-sm text-green-800">
          <FaSpinner className="animate-spin shrink-0" />
          <span>Uploading media…</span>
        </div>
      )}

      <div className="grid grid-cols-2 gap-2 sm:gap-3">
        <button
          type="button"
          disabled={mediaUploading}
          onClick={onChooseFromDevice}
          className="flex flex-col items-center justify-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-2 py-4 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-purple-100 text-purple-600">
            <FaImages className="text-lg" />
          </span>
          <span className="text-center text-[11px] font-semibold uppercase leading-tight text-gray-700 sm:text-xs">
            Gallery
          </span>
        </button>

        <button
          type="button"
          disabled={mediaUploading}
          onClick={onTakePhoto}
          className="flex flex-col items-center justify-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-2 py-4 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-pink-100 text-pink-600">
            <FaCamera className="text-lg" />
          </span>
          <span className="text-center text-[11px] font-semibold uppercase leading-tight text-gray-700 sm:text-xs">
            {cameraLabel}
          </span>
        </button>
      </div>
    </div>
  );
}
