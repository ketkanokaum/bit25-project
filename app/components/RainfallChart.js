'use client';

import React, { useMemo } from 'react';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';

const thaiMonths = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];

export default function RainfallChart({ data, selectedProvince, selectedYear }) {

    const chartOptions = useMemo(() => {
        // ── คง Logic IF-ELSE และ FOR LOOP เดิมของคุณเป๊ะๆ ──
        let filteredByProvince = [];
        if (selectedProvince === 'All') {
            filteredByProvince = data;
        } else {
            for (let i = 0; i < data.length; i++) {
                if (data[i].province === selectedProvince) {
                    filteredByProvince.push(data[i]);
                }
            }
        }

        let filteredData = [];
        if (selectedYear === 'All') {
            filteredData = filteredByProvince;
        } else {
            let targetYear = parseInt(selectedYear);
            for (let i = 0; i < filteredByProvince.length; i++) {
                if (filteredByProvince[i].year === targetYear) {
                    filteredData.push(filteredByProvince[i]);
                }
            }
        }

        let uniqueYears = [];
        for (let i = 0; i < filteredData.length; i++) {
            let currentYear = filteredData[i].year;
            if (uniqueYears.includes(currentYear) === false) {
                uniqueYears.push(currentYear);
            }
        }
        uniqueYears.sort((a, b) => a - b);

        let seriesList = [];
        for (let i = 0; i < uniqueYears.length; i++) {
            let targetYear = uniqueYears[i];
            let monthlyData = [null, null, null, null, null, null, null, null, null, null, null, null];
            for (let j = 0; j < filteredData.length; j++) {
                let record = filteredData[j];
                if (record.year === targetYear) {
                    let val = Number(record.average_rain);
                    if (isNaN(val) === false) {
                        monthlyData[record.month - 1] = parseFloat(val.toFixed(2));
                    }
                }
            }
            let yearThai = parseInt(targetYear) + 543;
            seriesList.push({
                name: yearThai.toString(),
                data: monthlyData,
                marker: { symbol: 'circle' }
            });
        }

        let finalSeries = seriesList.length > 0 ? seriesList : [{ name: 'ไม่มีข้อมูล', data: [] }];

        // ปรับจูนธีมกราฟให้เข้ากับ Tailwind (Slate-theme)
        return {
            chart: {
                type: 'line',
                style: { fontFamily: 'inherit' },
                height: 400,
                backgroundColor: 'transparent'
            },
            title: { text: '' },
            xAxis: {
                categories: thaiMonths,
                crosshair: true,
                labels: { style: { color: '#64748b' } }
            },
            yAxis: {
                title: { text: 'ปริมาณฝน (มม.)', style: { color: '#94a3b8' } },
                gridLineColor: '#f1f5f9'
            },
            tooltip: { shared: true, borderRadius: 12, backgroundColor: '#ffffff' },
            credits: { enabled: false },
            series: finalSeries
        };
    }, [data, selectedProvince, selectedYear]);

    if (!data || data.length === 0) return null;

    return (
        <div className="w-full h-full min-h-[400px]">
            <HighchartsReact highcharts={Highcharts} options={chartOptions} />
        </div>
    );
}