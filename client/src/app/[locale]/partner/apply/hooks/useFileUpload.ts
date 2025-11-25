import { useState } from "react";
import { validateFile } from "../utils/fileUpload";

/**
 * Hook to manage file upload state and validation
 */
export const useFileUpload = () => {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [fileErrors, setFileErrors] = useState<string[]>([]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      const newErrors: string[] = [];
      const validFiles: File[] = [];

      // Validate each file
      filesArray.forEach((file) => {
        const error = validateFile(file);
        if (error) {
          newErrors.push(error);
        } else {
          validFiles.push(file);
        }
      });

      setFileErrors(newErrors);
      setSelectedFiles((prev) => [...prev, ...validFiles]);
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const clearFiles = () => {
    setSelectedFiles([]);
    setFileErrors([]);
  };

  return {
    selectedFiles,
    fileErrors,
    handleFileChange,
    removeFile,
    clearFiles,
  };
};

