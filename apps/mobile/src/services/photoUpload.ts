import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';

import { apiClient } from '../api/client';

/**
 * Launch the native image picker, then upload the selected photo
 * directly to Azure Blob Storage via a backend-provided SAS URL.
 *
 * The backend endpoint (`POST /api/jobs/upload-sas`) is expected to
 * return `{ sasUrl, blobName, containerUrl }`. If the endpoint is not
 * yet available, the upload step is skipped and a warning is logged.
 *
 * @returns An error message on failure, or null on success.
 */
export async function pickAndUploadPhoto(jobId: string): Promise<string | null> {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== 'granted') {
    return 'Permissão para acessar fotos negada. Acesse as configurações para habilitá-la.';
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    quality: 0.8,
    allowsEditing: false,
  });

  if (result.canceled || !result.assets?.length) {
    return null; // user cancelled — not an error
  }

  const asset = result.assets[0];
  const fileName = asset.uri.split('/').pop() ?? `proof_${jobId}_${Date.now()}.jpg`;

  // Request a SAS URL from the backend
  const sasResult = await apiClient.getPhotoUploadSasUrl(jobId, fileName);
  if (!sasResult.success || !sasResult.data) {
    // Backend stub not yet implemented — log and return gracefully
    console.warn('[photoUpload] SAS URL endpoint not available. Skipping upload.');
    return null;
  }

  const { sasUrl } = sasResult.data;

  // Upload directly to Azure Blob Storage using the SAS URL
  try {
    const uploadResult = await FileSystem.uploadAsync(sasUrl, asset.uri, {
      httpMethod: 'PUT',
      headers: {
        'x-ms-blob-type': 'BlockBlob',
        'Content-Type': 'image/jpeg',
      },
      uploadType: FileSystem.FileSystemUploadType.BINARY_CONTENT,
    });

    if (uploadResult.status < 200 || uploadResult.status >= 300) {
      return `Falha no upload (HTTP ${uploadResult.status}).`;
    }
  } catch (err) {
    return err instanceof Error ? err.message : 'Erro desconhecido no upload.';
  }

  return null;
}

/**
 * Launch the camera, then upload the captured photo via SAS URL.
 */
export async function captureAndUploadPhoto(jobId: string): Promise<string | null> {
  const { status } = await ImagePicker.requestCameraPermissionsAsync();
  if (status !== 'granted') {
    return 'Permissão de câmera negada. Acesse as configurações para habilitá-la.';
  }

  const result = await ImagePicker.launchCameraAsync({
    quality: 0.8,
    allowsEditing: false,
  });

  if (result.canceled || !result.assets?.length) {
    return null;
  }

  const asset = result.assets[0];
  const fileName = `proof_${jobId}_${Date.now()}.jpg`;

  const sasResult = await apiClient.getPhotoUploadSasUrl(jobId, fileName);
  if (!sasResult.success || !sasResult.data) {
    console.warn('[photoUpload] SAS URL endpoint not available. Skipping upload.');
    return null;
  }

  try {
    const uploadResult = await FileSystem.uploadAsync(
      sasResult.data.sasUrl,
      asset.uri,
      {
        httpMethod: 'PUT',
        headers: {
          'x-ms-blob-type': 'BlockBlob',
          'Content-Type': 'image/jpeg',
        },
        uploadType: FileSystem.FileSystemUploadType.BINARY_CONTENT,
      },
    );

    if (uploadResult.status < 200 || uploadResult.status >= 300) {
      return `Falha no upload (HTTP ${uploadResult.status}).`;
    }
  } catch (err) {
    return err instanceof Error ? err.message : 'Erro desconhecido no upload.';
  }

  return null;
}
