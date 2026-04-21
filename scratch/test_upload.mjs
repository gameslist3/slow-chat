async function testUpload() {
  try {
    const formData = new FormData();
    const blob = new Blob(["test image"], { type: "image/png" });
    // node v24 supports File and FormData natively
    const file = new File([blob], "test.png", { type: "image/png" });
    
    formData.append('file', file);
    formData.append('upload_preset', 'gapes_unsigned');
    formData.append('folder', 'test_gapes');
    
    const response = await fetch('https://api.cloudinary.com/v1_1/dn16gm6ka/image/upload', {
        method: 'POST',
        body: formData,
    });
    
    const json = await response.json();
    console.log(response.status, json);
  } catch (e) {
    console.error(e);
  }
}
testUpload();
