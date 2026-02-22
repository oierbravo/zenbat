# Zenbat — How to Start the Application

## Prerequisites

- **Git**
- **nvm** (Node Version Manager) — [install guide](https://github.com/nvm-sh/nvm#installing-and-updating)

---

## 1. Clone the repository

```bash
git clone git@github.com:oierbravo/zenbat.git
cd zenbat
```

---

## 2. Install the required Node.js version

The project includes an `.nvmrc` file that pins the Node.js version. Run:

```bash
nvm install
nvm use
```

This installs and activates **Node.js 6.17.1** with **npm 3.10.10**.

Verify:

```bash
node --version   # v6.17.1
npm --version    # 3.10.10
```

---

## 3. Install global tools

```bash
npm install -g bower grunt-cli
```

Verify:

```bash
bower --version   # 1.x
grunt --version   # grunt-cli: 1.x
```

---

## 4. Install Node.js dependencies

```bash
npm install
```

---

## 5. Install frontend dependencies

```bash
bower install
```

---

## 6. Configure the data path

The application reads data from Excel files (`.xlsx`) and stores its flat-file databases in a `db/` folder. The base path is set in `zenbat.config.js`.

### Development (Linux/Mac)

The default `zenbat.config.js` uses `./data/` (relative to the project root). Create the folder and place the data files there:

```bash
mkdir -p data
# copy productos.xlsx, pedidos.xlsx, proveedores.xlsx into data/
```

### Windows (production)

An example config is provided at `example-win.zenbat.config.js` with the standard Windows paths (`C:\Ezarri\Zenbat\`). Copy it over `zenbat.config.js` and adjust if needed:

```bash
copy example-win.zenbat.config.js zenbat.config.js
```

Then place the data files (`productos.xlsx`, `pedidos.xlsx`, `proveedores.xlsx`) in `C:\Ezarri\Zenbat\`.

The `db/` folder for the flat-file databases is created automatically the first time the app writes data.

---

## 7. Start the application

### Development (with auto-reload)

```bash
grunt
```

This runs `nodemon` (auto-restarts on server changes) and `watch` (livereload on frontend changes) concurrently.

### Simple start (no auto-reload)

```bash
node server.js
```

### Production

```bash
export NODE_ENV=production
grunt
```

> **Port:** The app listens on port **80** by default. On Linux/Mac this requires root privileges. To use a different port:
> ```bash
> PORT=3000 grunt
> ```

---

## 8. Open the application

Navigate to [http://localhost](http://localhost) (or `http://localhost:3000` if you set a custom port).

---

## Windows Service (production only)

To install Zenbat as a Windows background service:

```bash
npm run install-windows-service
```

To remove it:

```bash
npm run uninstall-windows-service
```

---

## Troubleshooting

| Problem | Cause | Fix |
|---|---|---|
| `ENOENT: no such file or directory, open '...\productos.xlsx'` | Data files not found at `basePath` | Place `.xlsx` files in the path defined in `zenbat.config.js` |
| `Error: listen EACCES ... port 80` | Port 80 requires root on Linux | Run with `PORT=3000 grunt` or use `sudo` |
| `bower: command not found` | Global tools not installed | Run step 3 again after `nvm use` |
| `grunt: command not found` | Same as above | Run step 3 again after `nvm use` |
