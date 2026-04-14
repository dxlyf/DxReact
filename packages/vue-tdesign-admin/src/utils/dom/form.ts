enum ENCTYPE {
  MULTIPART_FORM_DATA = 'multipart/form-data',
  URL_ENCODED = 'application/x-www-form-urlencoded',
  JSON = 'application/json',
  TEXT = 'text/plain',
  XML = 'application/xml',
}

// form 无刷新提交
export const submitData=(data:Record<string,any>)=>{
  const form = document.createElement('form');
  form.method = 'post';
  form.action = '/api/savefile';
  form.enctype = 'multipart/form-data';
  form.target='_blank';
  form.style.display = 'none';
  document.body.appendChild(form);
  form.reset();
}