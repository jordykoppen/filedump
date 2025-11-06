import type { BunStoreFile } from "@/schemas";
import { formatBytes } from "@/utils/formatBytes";
import { format } from "date-fns";
import { XIcon } from "@phosphor-icons/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

interface FileDialogProps {
  file: BunStoreFile;
  onClose: () => void;
}

const deleteFile = async (hash: string) => {
  const response = await fetch(`/api/file/${hash}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || `Delete failed with status ${response.status}`);
  }

  return response;
};

export const FileDialog = ({ file, onClose }: FileDialogProps) => {
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: deleteFile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["files"] });
      onClose();
    },
    onError: (error) => {
      console.error("Delete failed:", error);
      alert("Failed to delete file. Please try again.");
    },
  });

  const handleDelete = (hash: string) => {
    if (confirm("Are you sure you want to delete this file?")) {
      deleteMutation.mutate(hash);
    }
  };

  return (
    <div className="absolute inset-0 bg-black/10 flex backdrop-blur-[2px] z-10">
      <div className="absolute inset-0" onClick={onClose} />
      <div className="relative w-xs p-4 bg-gray-900 m-auto rounded-md flex flex-col gap-4 z-50">
        <button className="absolute right-2 top-2" onClick={onClose}>
          <XIcon />
        </button>

        <p className="text-sm break-all m-0 text-white/90 pr-4">{file.name}</p>
        <dl className="text-xs text-gray-400 grid grid-rows-3 gap-2">
          <div>
            <dt className="text-gray-500">size</dt>
            <dd>{formatBytes(file.size)}</dd>
          </div>
          <div>
            <dt className="text-gray-500">type</dt>
            <dd>{file.mimeType}</dd>
          </div>
          <div>
            <dt className="text-gray-500">uploaded</dt>
            <dd>{format(new Date(file.createdAt), "dd/MM/yyyy HH:mm")}</dd>
          </div>
        </dl>

        <p className=" bg-gray-950 p-2 rounded text-xs break-all text-green-500">
          <small className="block text-gray-500 mb-px">hash</small>
          {file.hash}
        </p>
        <p className=" bg-gray-950 p-2 rounded text-xs break-all text-green-500">
          <small className="block text-gray-500 mb-px">path</small>
          {file.path.slice(1, -1)}
        </p>
        <div className="flex justify-end gap-2">
          <button
            className="p-1 px-2 text-sm rounded-sm text-red-500"
            onClick={handleDelete.bind(null, file.hash)}
          >
            delete
          </button>
          <a
            className="text-center p-1 px-2 text-sm rounded-sm text-white/90"
            href={`/api/file/${file.hash}`}
            target="_blank"
          >
            download
          </a>
        </div>
      </div>
    </div>
  );
};
