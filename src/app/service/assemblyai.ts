import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AssemblyAiService {
  private base = 'https://api.assemblyai.com/v2';
  private apiKey = environment.ASSEMBLYAI_API_KEY;

  // Upload file to AssemblyAI /v2/upload -> returns uploaded file URL
  async uploadFile(file: File, onProgress?: (pct: number) => void): Promise<string> {
    // AssemblyAI allows a direct /v2/upload POST with binary body.
    // We'll use fetch with streaming to report progress (simple approach).
    // For large files you may want to chunk.
    const url = `${this.base}/upload`;
    return new Promise<string>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', url);
      xhr.setRequestHeader('Authorization', this.apiKey);
      xhr.responseType = 'json';

      xhr.upload.onprogress = (ev) => {
        if (ev.lengthComputable && onProgress) {
          const pct = Math.round((ev.loaded / ev.total) * 100);
          onProgress(pct);
        }
      };

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          const resp = xhr.response;
          // response returns { upload_url: "https://..." }
          // AssemblyAI sometimes returns plain URL or {upload_url}
          const uploadUrl = resp.upload_url ?? resp;
          resolve(uploadUrl);
        } else {
          reject(new Error(`Upload failed: ${xhr.status} ${xhr.statusText}`));
        }
      };

      xhr.onerror = () => reject(new Error('Network error during upload'));
      xhr.send(file);
    });
  }

  // Create transcript (submit)
  async createTranscript(audioUrl: string): Promise<any> {
    const resp = await fetch(`${this.base}/transcript`, {
      method: 'POST',
      headers: {
        'Authorization': this.apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ audio_url: audioUrl })
    });
    if (!resp.ok) throw new Error(`Create transcript failed: ${resp.status}`);
    return resp.json();
  }

  // Get transcript by id
  async getTranscript(transcriptId: string): Promise<any> {
    const resp = await fetch(`${this.base}/transcript/${transcriptId}`, {
      headers: { 'Authorization': this.apiKey }
    });
    if (!resp.ok) throw new Error(`Get transcript failed: ${resp.status}`);
    return resp.json();
  }

  // Request subtitles (format = 'vtt' or 'srt')
  async getSubtitles(transcriptId: string, format: 'vtt' | 'srt' = 'vtt'): Promise<string> {
    // This endpoint returns the contents (text) of the subtitle file.
    const resp = await fetch(`${this.base}/transcript/${transcriptId}/subtitles?format=${format}`, {
      headers: { 'Authorization': this.apiKey }
    });
    if (!resp.ok) throw new Error(`Get subtitles failed: ${resp.status}`);
    return resp.text();
  }
}
