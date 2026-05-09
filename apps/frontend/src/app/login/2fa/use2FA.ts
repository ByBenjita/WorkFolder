import { useState } from 'react';

export const use2FA = () => {
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const handleInputChange = (value: string, index: number) => {
    if (!/^\d*$/.test(value)) return;
    const newCode = [...code];
    newCode[index] = value.slice(-1);
    setCode(newCode);
    if (value && index < 5) {
      const inputs = document.querySelectorAll('input');
      (inputs[index + 1] as HTMLInputElement).focus();
    }
  };
  const handleSubmit = () => console.log("Código:", code.join(''));
  return { code, handleInputChange, handleSubmit };
};