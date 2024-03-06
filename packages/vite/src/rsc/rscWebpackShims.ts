export const rscWebpackShims = `globalThis.__rw_module_cache__ = new Map();

globalThis.__webpack_chunk_load__ = (id) => {
  return import(id).then((m) => globalThis.__rw_module_cache__.set(id, m))
};

globalThis.__webpack_require__ = (id) => {
  return globalThis.__rw_module_cache__.get(id)
};\n`
