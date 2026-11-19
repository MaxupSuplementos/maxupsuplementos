const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const source = fs.readFileSync(path.join(__dirname, '..', 'Ventas.gs'), 'utf8');
assert.match(
  source,
  /\['Prioridad','Producto','Marca','Pedir a AG','Pedir a Colo','Pedir a One Fit'/,
  'Las tres columnas de proveedores deben quedar visibles junto al producto'
);
const context = {};
vm.createContext(context);
vm.runInContext(source, context);

const proveedorCercano = context._reposicionElegirProveedor_({
  proveedor: '', ag: 100000, colo: 98000, one: 110000
}, 'STAR NUTRITION');
assert.equal(proveedorCercano.proveedor, 'AG SUPLEMENTOS', 'AG debe priorizarse si queda a menos de 3% del más barato');

const proveedorBarato = context._reposicionElegirProveedor_({
  proveedor: '', ag: 110000, colo: 90000, one: 95000
}, 'STAR NUTRITION');
assert.equal(proveedorBarato.proveedor, 'COLO MAYORISTA', 'Debe elegirse el menor costo puesto si AG queda lejos');

const accesorio = context._reposicionElegirProveedor_({
  proveedor: 'ONE FIT', ag: 0, colo: 0, one: 12000, costo: 9000
}, 'ACCESORIOS');
assert.equal(accesorio.proveedor, 'AG SUPLEMENTOS', 'Los accesorios deben asignarse siempre a AG');

assert.equal(context._reposicionPrioridad_(0, 1, 0, 1).nivel, 1, 'Sin stock debe ser prioridad máxima');
assert.equal(context._reposicionPrioridad_(8, 1, 240, 1).nivel, 4, 'Stock holgado debe poder esperar');

class FakeRange {
  constructor(sheet, row, col, rows, cols) {
    this.sheet = sheet;
    this.row = row;
    this.col = col;
    this.rows = rows || 1;
    this.cols = cols || 1;
  }
  getValues() {
    const out = [];
    for (let r = 0; r < this.rows; r++) {
      const line = [];
      for (let c = 0; c < this.cols; c++) {
        line.push((this.sheet.values[this.row - 1 + r] || [])[this.col - 1 + c] || '');
      }
      out.push(line);
    }
    return out;
  }
  setValues(values) {
    for (let r = 0; r < values.length; r++) {
      if (!this.sheet.values[this.row - 1 + r]) this.sheet.values[this.row - 1 + r] = [];
      for (let c = 0; c < values[r].length; c++) {
        this.sheet.values[this.row - 1 + r][this.col - 1 + c] = values[r][c];
      }
    }
    return this;
  }
}

class FakeSheet {
  constructor() { this.values = []; this.hidden = false; }
  getLastRow() { return this.values.length; }
  getRange(row, col, rows, cols) { return new FakeRange(this, row, col, rows, cols); }
  clearContents() { this.values = []; return this; }
  hideSheet() { this.hidden = true; }
}

class FakeSpreadsheet {
  constructor() { this.sheets = {}; }
  getSheetByName(name) { return this.sheets[name] || null; }
  insertSheet(name) { return (this.sheets[name] = new FakeSheet()); }
}

const ss = new FakeSpreadsheet();
const producto = { clave: 'star||creatina', marca: 'STAR', nombre: 'Creatina', stock: 5 };
let pendientes = context._reposicionActualizarPendientes_(ss, [producto], 'inicio');
assert.equal(pendientes[producto.clave], 0, 'La primera foto no debe inventar ventas');

pendientes = context._reposicionActualizarPendientes_(ss, [{ ...producto, stock: 4 }], 'venta');
assert.equal(pendientes[producto.clave], 1, 'Una baja de stock debe sumar una unidad pendiente');

pendientes = context._reposicionActualizarPendientes_(ss, [{ ...producto, stock: 6 }], 'reposición');
assert.equal(pendientes[producto.clave], 0, 'Una entrada de stock debe descontar lo pendiente');

console.log('Reposición por proveedor: OK');
