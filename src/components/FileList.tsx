import type { BunStoreFile } from "@/schemas";
import { formatBytes } from "@/utils/formatBytes";
import { format } from "date-fns";

export const FileList = ({
  files,
  setSelectedId,
  footer,
}: {
  files: BunStoreFile[];
  setSelectedId: (id: string) => void;
  footer: string;
}) => {
  const handleRowEnterOrSpacebar =
    (fileHash: string) => (e: React.KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        setSelectedId(fileHash);
      }
    };

  return (
    <>
      <div className="overflow-y-auto min-h-0">
        <table className="min-h-0 w-full table text-left text-sm text-gray-400 rounded">
          <tbody>
            {files.map((file: BunStoreFile) => (
              <tr
                key={file.hash}
                className="font-mono cursor-pointer hover:bg-green-950  focus:bg-green-950 focus:outline-none"
                onClick={setSelectedId.bind(null, file.hash)}
                onKeyDown={handleRowEnterOrSpacebar(file.hash)}
                tabIndex={0}
                role="button"
                aria-label={`View details for ${file.name}`}
              >
                <td className="px-2 py-1 ">{file.hash.slice(0, 8)}</td>
                <td className="px-2 py-1 text-white font-sans max-w-56 truncate">
                  {file.name}
                </td>
                <td className="px-2 py-1 lowercase">
                  {formatBytes(file.size)}
                </td>
                <td className="px-2 py-1 text-right">
                  {format(new Date(file.createdAt), "dd/MM/yyyy HH:mm")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="border border-gray-600 p-1.5 rounded">
        <p className="text-xs text-gray-400 text-center">{footer}</p>
      </div>
    </>
  );
};
