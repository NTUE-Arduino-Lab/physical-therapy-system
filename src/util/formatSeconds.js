const formatSeconds = (input) => {
    const sec_num = parseInt(input, 10);
    const hours = Math.floor(sec_num / 3600);
    const minutes = Math.floor((sec_num - hours * 3600) / 60);
    const seconds = sec_num - hours * 3600 - minutes * 60;

    let formatted = '';
    if (hours != 0) formatted += `${hours}時 `;
    if (minutes != 0) formatted += `${minutes}分 `;
    if (seconds != 0) formatted += `${seconds}秒`;

    return formatted;
};

export default formatSeconds;
