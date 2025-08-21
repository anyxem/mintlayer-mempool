import { decode_signed_transaction_to_js } from './lib/wasm/wasm_wrappers';
import { parseDecodedTx } from './src/parseDecodedTx';

import { TESTING_SET } from './decode_tests/testing_set';

const result: any = {}

for (const [name, mock] of Object.entries(TESTING_SET)) {
  const t_hex = (mock as any).raw;
  const t_u8 = new Uint8Array(t_hex.match(/.{1,2}/g)!.map((byte: any) => parseInt(byte, 16)));
  const decoded = decode_signed_transaction_to_js(t_u8, 1);

  const parsed = parseDecodedTx(decoded);

  result[name] = {
    pass: parsed === (mock as any).json,
    ...(parsed !== (mock as any).json ? {
      parsed: parsed,
      expected: (mock as any).json,
    } : {})
  };

}

console.log(JSON.stringify(result, null, 2));
