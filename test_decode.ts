import { decode_signed_transaction_to_js, decode_partially_signed_transaction_to_js, get_transaction_id } from './lib/wasm/wasm_wrappers';

const t_hex = "0100040000f590bd98046cfa96c743322eacca1d4c7797c1ce5ab18426a1a23c5fa60e11bd000000000400000700743ba40b019d773d6552b1cc1a3490ef2543eea7880aab14ce040004010a000700e87648179fdff1730ba34fe7ceeff431cf87acef849bbe0b01bd4daba462c79bc9ab2cf47b5dc16162cd1b63100204019d773d6552b1cc1a3490ef2543eea7880aab14ce0401019d773d6552b1cc1a3490ef2543eea7880aab14ce04000000"

const t_u8 = new Uint8Array(t_hex.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16)));

const decoded = decode_signed_transaction_to_js(t_u8, 1);

console.log(JSON.stringify(decoded, null, 2));

const tx_id = get_transaction_id(t_u8, false);

console.log(tx_id);
