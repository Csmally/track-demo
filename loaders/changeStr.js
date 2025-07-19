module.exports = function (source) {
  if (!this.resourceQuery?.includes("type=template")) {
    return source;
  }
  console.log("9898--几次-✈️✈️✈️✈️✈️✈️✈️✈️", source);
  const templateRegex = /<template>([\s\S]*?)<\/template>/;
  const match = source.match(templateRegex);
  if (!match) {
    return source; // 没 template，直接返回
  }

  const originalTemplate = match[1];
  const replacedTemplate = originalTemplate.replace(/点击/g, "测试");
  const newTemplate = `<template>${replacedTemplate}</template>`;

  const newSource = source.replace(templateRegex, newTemplate);
  return newSource;
};
