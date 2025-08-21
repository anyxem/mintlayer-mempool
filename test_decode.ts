import { decode_signed_transaction_to_js, get_transaction_id } from './lib/wasm/wasm_wrappers';

const t_hex = "01000400003e0c04ce80dff7dfae5be22b9ada59f0338d2a6ad6204aa1320a2fa5d6ca7afa00000000080000070010a5d4e801efbdd0e624301780e4b9c7e0285bb2714c2762cf00000fe07a901c8d0f060186ec450457d09ad9807393d89cec9c71d62060210401018d010003b1c84548191117df2d11c53f84ec78a06320f666a81c52dce5a3d6530908f52200705c0d53e2a07aaf3f6749162b77e6c6874c63190b0a4ceb6581b237ae1857c303d2469f573ebedbd2513623fe1f7c268a383290273c4c1aae54e50d9afcdd9b"

const t_u8 = new Uint8Array(t_hex.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16)));

const decoded = decode_signed_transaction_to_js(t_u8, 1);

console.log(JSON.stringify(decoded, null, 2));

const tx_id = get_transaction_id(t_u8, false);

console.log(tx_id);
