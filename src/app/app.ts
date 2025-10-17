import { Component } from '@angular/core';
import { AssemblyAiService } from './service/assemblyai';
import { CommonModule } from '@angular/common';


@Component({
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrls: ['./app.css'],
  standalone: true,
  imports:[CommonModule]
})
export class AppComponent {
  file?: File;
  status = 'idle';
  progress = 0;
  transcriptId?: string;
  downloadName = 'subtitles.vtt';
  error?: string;

  constructor(private ai: AssemblyAiService) {}

  onFileSelected(ev: Event) {
    const input = ev.target as HTMLInputElement;
    if (input.files && input.files.length) {
      this.file = input.files[0];
      this.error = undefined;
    }
  }

  async start() {
    if (!this.file) { this.error = 'Pick a video file first'; return; }
    this.error = undefined;
    this.status = 'uploading';
    this.progress = 0;
    try {
      // 1) upload file
      const uploadedUrl = await this.ai.uploadFile(this.file, (pct) => {
        this.progress = pct;
      });
      this.status = 'creating transcript';
      // 2) create transcript
      const createResp = await this.ai.createTranscript(uploadedUrl);
      this.transcriptId = createResp.id;
      this.status = 'processing';
      // 3) poll until completed
      let transcript: any = createResp;
      while (transcript.status !== 'completed') {
        if (transcript.status === 'error') {
          throw new Error('Transcription error: ' + (transcript.error ?? 'unknown'));
        }
        await new Promise(r => setTimeout(r, 3000)); // wait 3s
        transcript = await this.ai.getTranscript(this.transcriptId!);
        this.status = `processing (${transcript.status})`;
      }
      // 4) fetch subtitles (vtt)
      this.status = 'fetching subtitles';
      const vttText = await this.ai.getSubtitles(this.transcriptId!, 'vtt');
      // 5) trigger download
      this.triggerDownload(vttText, this.downloadName);
      this.status = 'done';
    } catch (err: any) {
      this.error = err?.message ?? String(err);
      this.status = 'error';
    }
  }

  triggerDownload(text: string, filename: string) {
    const blob = new Blob([text], { type: 'text/vtt;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }
}
