require('dotenv').config();
const { app, Menu, MenuItem, ipcMain, BrowserWindow, shell } = require('electron');
const path = require('path');
const { createMenu } = require('../Menu.js');
const express = require('express');
const Cluster = require('./heavy.js');
const serveur = require('../serveur.js');
const { generateResponse, makeResponse } = require('./groq-utils.js');
const electronReload = require('electron-reload');
const { spawn } = require('child_process');

if (process.env.NODE_ENV === 'development') {
    electronReload(__dirname);
}

function createWindow() {
    const win = new BrowserWindow({
        width: 987,
        height: 610,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            renderer: path.join(__dirname, 'renderer.js'),
            contextIsolation: true,
            enableRemoteModule: false,
        },
    });

    win.loadURL('http://localhost:3000/index.html'); // URL corrigée
    createMenu();
    if (process.env.NODE_ENV === 'development') {
        win.webContents.openDevTools();
    }
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
});