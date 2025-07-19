/* eslint-disable */
const charsetFunc: Record<string, Function> = {
  "+": (value: any) => +value,
  "!": (value: any) => !value,
};

const operateCharsets = Object.keys(charsetFunc);

export default function parse(json: any) {
  let { value } = json;
  const data = json.data;
  const firstCode = value[0];
  const shouldOperate = operateCharsets.includes(firstCode);
  if (shouldOperate) {
    value = value.slice(1);
  }

  const Reg = /\[([\w\W]*)\]/;
  while (Reg.test(value)) {
    const v = RegExp.$1;
    if (isNaN(Number(v))) {
      value = value.replace(
        RegExp.$1,
        parse({
          data,
          value: RegExp.$1,
        })
      );
    }
    value = value.replace(/\[/g, ".").replace(/\]/g, "");
  }
  const valueArr = value.split(".");

  let temp = data || {};
  for (let i = 0; i < valueArr.length; i++) {
    const value = valueArr[i];
    if (temp[value] === undefined || temp[value] === null) {
      return undefined;
    }
    temp = temp[value];
  }

  if (shouldOperate) {
    temp = charsetFunc[firstCode](temp);
  }
  return temp;
}
