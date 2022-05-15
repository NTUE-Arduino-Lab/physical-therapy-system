const configLineChart = (data, targetHeartRate) => ({
    data: [data, data],
    xField: 'timeLabel',
    yField: ['rpm', 'heartRate'],
    yAxis: {
        rpm: {
            title: {
                text: 'RPM',
            },
        },
        heartRate: {
            title: {
                text: '心率',
            },
        },
    },
    // xAxis: {
    //     title: {
    //         text: '時間',
    //     },
    // },
    legend: {
        itemName: {
            formatter: (text, item) => {
                return item.value === 'rpm' ? 'RPM' : '心率';
            },
        },
    },
    meta: {
        rpm: {
            alias: 'RPM值 ',
            formatter: (value) => {
                return `${value} RPM`;
            },
        },
        heartRate: {
            alias: '心率',
            formatter: (value) => {
                return `${value} BPM`;
                // return Number((v / 100).toFixed(1));
            },
        },
    },
    geometryOptions: [
        {
            geometry: 'line',
            color: '#5B8FF9',
            lineStyle: {
                lineWidth: 2,
                lineDash: [5, 5],
            },
        },
        {
            geometry: 'line',
            color: '#5AD8A6',
            smooth: true,
            lineStyle: {
                lineWidth: 4,
                opacity: 0.5,
            },
            point: {
                shape: 'circle',
                size: 4,
                style: {
                    opacity: 0.5,
                    stroke: '#5AD8A6',
                    fill: '#fff',
                },
            },
        },
    ],
    annotations: {
        heartRate: [
            {
                type: 'line',
                start: ['min', targetHeartRate], // TODO: change [138] to 目標心率
                end: ['max', targetHeartRate], // TODO: change [138] to 目標心率
                style: {
                    lineWidth: 2,
                    lineDash: [3, 3],
                    stroke: '#F4664A',
                },
                text: {
                    content: `目標心率(${targetHeartRate})`, // TODO: change [138] to 目標心率
                    offsetY: -4,
                    position: 'end',
                    style: {
                        textAlign: 'end',
                    },
                },
            },
        ],
    },
    tooltip: {
        showTitle: true,
    },
});

export default configLineChart;
