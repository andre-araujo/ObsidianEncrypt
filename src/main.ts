import { Plugin } from 'obsidian';
import * as CryptoJS from 'crypto-js';
import { encrypt, decrypt } from './encryption';
import * as fs from 'fs';

interface ProtectedNotes {
  [key: string]: string;
}

export default class ObsidianCrypto extends Plugin {
  protectedNotes: ProtectedNotes = {};

  async onload() {
    this.loadProtectedNotes();

    this.addCommand({
      id: 'encrypt-note',
      name: 'Encrypt Note',
      callback: () => this.encryptNote(),
    });

    this.addCommand({
      id: 'decrypt-note',
      name: 'Decrypt Note',
      callback: () => this.decryptNote(),
    });
  }

  onunload() {
    this.saveProtectedNotes();
  }

  async encryptNote() {
    const activeFile = this.app.workspace.getActiveFile();
    if (!activeFile) return;

    const password = await this.promptForPassword();
    if (!password) return;

    const content = await this.app.vault.read(activeFile);
    const encryptedContent = encrypt(content, password);

    await this.app.vault.modify(activeFile, encryptedContent);
    this.protectedNotes[activeFile.path] = password;
    this.saveProtectedNotes();
  }

  async decryptNote() {
    const activeFile = this.app.workspace.getActiveFile();
    if (!activeFile) return;

    const password = await this.promptForPassword();
    if (!password) return;

    const content = await this.app.vault.read(activeFile);
    try {
      const decryptedContent = decrypt(content, password);
      await this.app.vault.modify(activeFile, decryptedContent);
      this.protectedNotes[activeFile.path] = password;
      this.saveProtectedNotes();
    } catch (error) {
      this.displayErrorMessage('Incorrect password. Please try again.');
    }
  }

  async promptForPassword(): Promise<string | null> {
    return new Promise((resolve) => {
      const prompt = new PromptModal(this.app, 'Enter Password', (password) => {
        resolve(password);
      });
      prompt.open();
    });
  }

  displayErrorMessage(message: string) {
    new Notice(message);
  }

  loadProtectedNotes() {
    try {
      const data = fs.readFileSync('protected_notes.json', 'utf8');
      this.protectedNotes = JSON.parse(data);
    } catch (error) {
      this.protectedNotes = {};
    }
  }

  saveProtectedNotes() {
    fs.writeFileSync('protected_notes.json', JSON.stringify(this.protectedNotes));
  }
}

class PromptModal extends Modal {
  title: string;
  callback: (password: string) => void;

  constructor(app: App, title: string, callback: (password: string) => void) {
    super(app);
    this.title = title;
    this.callback = callback;
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.createEl('h2', { text: this.title });

    const inputEl = contentEl.createEl('input', { type: 'password' });
    inputEl.focus();

    const submitButton = contentEl.createEl('button', { text: 'Submit' });
    submitButton.onclick = () => {
      const password = inputEl.value;
      this.callback(password);
      this.close();
    };
  }

  onClose() {
    const { contentEl } = this;
    contentEl.empty();
  }
}
