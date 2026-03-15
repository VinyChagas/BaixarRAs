/**
 * Utilitários para manipulação de arquivos e diretórios
 */

import fs from 'fs';
import path from 'path';
import { logger } from './logger.js';

/**
 * Garante que o diretório existe, criando se necessário
 */
export function ensureDirectoryExists(dirPath) {
  if (!dirPath) return;
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    logger.debug(`Diretório criado: ${dirPath}`);
  }
}

/**
 * Sanitiza nome de arquivo para evitar caracteres inválidos
 */
export function sanitizeFileName(name) {
  if (!name || typeof name !== 'string') return 'arquivo';
  return name
    .replace(/[<>:"/\\|?*]/g, '_')
    .replace(/\s+/g, '_')
    .replace(/\.{2,}/g, '.')
    .substring(0, 200) || 'arquivo';
}

/**
 * Gera nome único para evitar conflito
 */
export function uniqueFileName(basePath, originalName) {
  const ext = path.extname(originalName);
  const base = path.basename(originalName, ext);
  const sanitized = sanitizeFileName(base) + ext;
  let filepath = path.join(basePath, sanitized);
  let counter = 1;

  while (fs.existsSync(filepath)) {
    const newName = `${sanitizeFileName(base)}_${counter}${ext}`;
    filepath = path.join(basePath, newName);
    counter++;
  }
  return filepath;
}

/**
 * Lista arquivos no diretório (exclui .crdownload e .tmp)
 */
export function listFiles(dirPath) {
  if (!dirPath || !fs.existsSync(dirPath)) return [];
  return fs.readdirSync(dirPath).filter((f) => {
    if (f.endsWith('.crdownload') || f.endsWith('.tmp')) return false;
    const fullPath = path.join(dirPath, f);
    return fs.statSync(fullPath).isFile();
  });
}

/**
 * Retorna snapshot dos arquivos com mtime para comparação
 */
export function getFileSnapshot(dirPath) {
  if (!dirPath || !fs.existsSync(dirPath)) return { files: [], time: Date.now() };
  const files = fs.readdirSync(dirPath);
  const result = [];
  for (const f of files) {
    if (f.endsWith('.crdownload')) continue;
    const fullPath = path.join(dirPath, f);
    try {
      const stat = fs.statSync(fullPath);
      if (stat.isFile()) result.push({ name: f, mtime: stat.mtimeMs });
    } catch {}
  }
  return { files: result, time: Date.now() };
}

/**
 * Retorna o arquivo mais recente no diretório
 */
export function getLatestDownloadedFile(dirPath) {
  const files = listNewFilesSince(dirPath, 0);
  if (files.length === 0) return null;
  files.sort((a, b) => b.mtime - a.mtime);
  return files[0];
}

/**
 * Lista arquivos novos desde um timestamp (exclui .crdownload)
 */
export function listNewFilesSince(dirPath, sinceTime) {
  if (!fs.existsSync(dirPath)) return [];
  const files = fs.readdirSync(dirPath);
  const result = [];

  for (const f of files) {
    if (f.endsWith('.crdownload')) continue;
    const fullPath = path.join(dirPath, f);
    const stat = fs.statSync(fullPath);
    if (stat.mtimeMs >= sinceTime && stat.isFile()) {
      result.push({ name: f, path: fullPath, mtime: stat.mtimeMs });
    }
  }
  return result;
}

/**
 * Aguarda o download terminar (arquivos .crdownload desaparecem)
 * @param {string|string[]} downloadDir - Diretório ou array de diretórios a verificar
 */
export async function waitForDownloadToFinish(downloadDir, timeoutMs = 60000, pollIntervalMs = 500) {
  const dirs = Array.isArray(downloadDir) ? downloadDir : [downloadDir];
  const startTime = Date.now();

  while (Date.now() - startTime < timeoutMs) {
    let hasAnyCrdownload = false;
    for (const dir of dirs) {
      if (fs.existsSync(dir)) {
        const files = fs.readdirSync(dir);
        if (files.some((f) => f.endsWith('.crdownload'))) {
          hasAnyCrdownload = true;
          break;
        }
      }
    }
    if (!hasAnyCrdownload) return true;
    await new Promise((r) => setTimeout(r, pollIntervalMs));
  }

  throw new Error(`Download não concluído dentro do timeout (${timeoutMs}ms)`);
}

/**
 * Move arquivo baixado para destino final se necessário
 */
export function moveDownloadedFileIfNeeded(sourcePath, destDir, preferredName) {
  ensureDirectoryExists(destDir);
  const finalPath = uniqueFileName(destDir, preferredName || path.basename(sourcePath));

  if (path.resolve(sourcePath) !== path.resolve(finalPath)) {
    fs.renameSync(sourcePath, finalPath);
    return finalPath;
  }
  return sourcePath;
}
