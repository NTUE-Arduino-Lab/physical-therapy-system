/* eslint-disable no-unused-vars */
import React, { useEffect, useState } from 'react';
import { Form, Input, Typography } from 'antd';
import PropTypes from 'prop-types';

import styles from './styles.module.scss';
const { Title } = Typography;

const SixMinutesTest = ({ formInstance, sixSurveyNewData, readOnly }) => {
    return (
        <div>
            <Title level={2} style={{ padding: '24px' }}>
                6 minutes walking test
                <span style={{ marginLeft: '1em' }}>
                    姓名：{sixSurveyNewData?.name}{' '}
                </span>
                <span style={{ marginLeft: '1em' }}>
                    日期：
                    {sixSurveyNewData?.beginWorkoutTime}
                </span>
            </Title>
            <Form
                form={formInstance}
                style={{ width: '100%' }}
                className={styles.form}
                initialValues={sixSurveyNewData?.form}
                // initialValues={{
                //     '1minBP': 'd',
                //     '1minBorg': '',
                //     '1minDistance': '',
                //     '1minHR': '',
                //     '1minO2': 'dd',
                //     '1minRR': undefined,
                // }}
            >
                <Form.Item label="O2 use" colon={false} />
                <Form.Item label="Time" colon={false} />
                <Form.Item label="Spo2" colon={false} />
                <Form.Item
                    label={
                        <>
                            HR
                            <br />
                            (beat/min)
                        </>
                    }
                    colon={false}
                />
                <Form.Item
                    label={
                        <>
                            BP
                            <br />
                            (mmhg)
                        </>
                    }
                    colon={false}
                />
                <Form.Item label="RR" colon={false} />
                <Form.Item label="Borg Scale" colon={false} />
                <Form.Item label="Distance" colon={false} />

                <Form.Item name="restO2">
                    <Input type="text" readOnly={readOnly} />
                </Form.Item>
                <Form.Item label="Rest" colon={false} />
                <Form.Item name="restSpo2">
                    <Input type="text" readOnly={readOnly} />
                </Form.Item>
                <Form.Item name="restHR">
                    <Input type="text" readOnly={readOnly} />
                </Form.Item>
                <Form.Item name="restBP">
                    <Input type="text" readOnly={readOnly} />
                </Form.Item>
                <Form.Item name="restRR">
                    <Input type="text" readOnly={readOnly} />
                </Form.Item>
                <Form.Item name="restBorg">
                    <Input type="text" readOnly={readOnly} />
                </Form.Item>
                <Form.Item name="restDistance">
                    <Input type="text" readOnly={readOnly} />
                </Form.Item>

                <Form.Item name="1minO2">
                    <Input type="text" readOnly={readOnly} />
                </Form.Item>
                <Form.Item label="1min" colon={false} />
                <Form.Item name="1minSpo2">
                    <Input type="text" readOnly={readOnly} />
                </Form.Item>
                <Form.Item name="1minHR">
                    <Input type="text" readOnly={readOnly} />
                </Form.Item>
                <Form.Item name="1minBP">
                    <Input type="text" readOnly={readOnly} />
                </Form.Item>
                <Form.Item name="1minRR">
                    <Input type="text" readOnly={readOnly} />
                </Form.Item>
                <Form.Item name="1minBorg">
                    <Input type="text" readOnly={readOnly} />
                </Form.Item>
                <Form.Item name="1minDistance">
                    <Input type="text" readOnly={readOnly} />
                </Form.Item>

                <Form.Item name="2minO2">
                    <Input type="text" readOnly={readOnly} />
                </Form.Item>
                <Form.Item label="2min" colon={false} />
                <Form.Item name="2minSpo2">
                    <Input type="text" readOnly={readOnly} />
                </Form.Item>
                <Form.Item name="2minHR">
                    <Input type="text" readOnly={readOnly} />
                </Form.Item>
                <Form.Item name="2minBP">
                    <Input type="text" readOnly={readOnly} />
                </Form.Item>
                <Form.Item name="2minRR">
                    <Input type="text" readOnly={readOnly} />
                </Form.Item>
                <Form.Item name="2minBorg">
                    <Input type="text" readOnly={readOnly} />
                </Form.Item>
                <Form.Item name="2minDistance">
                    <Input type="text" readOnly={readOnly} />
                </Form.Item>

                <Form.Item name="3minO2">
                    <Input type="text" readOnly={readOnly} />
                </Form.Item>
                <Form.Item label="3min" colon={false} />
                <Form.Item name="3minSpo2">
                    <Input type="text" readOnly={readOnly} />
                </Form.Item>
                <Form.Item name="3minHR">
                    <Input type="text" readOnly={readOnly} />
                </Form.Item>
                <Form.Item name="3minBP">
                    <Input type="text" readOnly={readOnly} />
                </Form.Item>
                <Form.Item name="3minRR">
                    <Input type="text" readOnly={readOnly} />
                </Form.Item>
                <Form.Item name="3minBorg">
                    <Input type="text" readOnly={readOnly} />
                </Form.Item>
                <Form.Item name="3minDistance">
                    <Input type="text" readOnly={readOnly} />
                </Form.Item>

                <Form.Item name="4minO2">
                    <Input type="text" readOnly={readOnly} />
                </Form.Item>
                <Form.Item label="4min" colon={false} />
                <Form.Item name="4minSpo2">
                    <Input type="text" readOnly={readOnly} />
                </Form.Item>
                <Form.Item name="4minHR">
                    <Input type="text" readOnly={readOnly} />
                </Form.Item>
                <Form.Item name="4minBP">
                    <Input type="text" readOnly={readOnly} />
                </Form.Item>
                <Form.Item name="4minRR">
                    <Input type="text" readOnly={readOnly} />
                </Form.Item>
                <Form.Item name="4minBorg">
                    <Input type="text" readOnly={readOnly} />
                </Form.Item>
                <Form.Item name="4minDistance">
                    <Input type="text" readOnly={readOnly} />
                </Form.Item>

                <Form.Item name="5minO2">
                    <Input type="text" readOnly={readOnly} />
                </Form.Item>
                <Form.Item label="5min" colon={false} />
                <Form.Item name="5minSpo2">
                    <Input type="text" readOnly={readOnly} />
                </Form.Item>
                <Form.Item name="5minHR">
                    <Input type="text" readOnly={readOnly} />
                </Form.Item>
                <Form.Item name="5minBP">
                    <Input type="text" readOnly={readOnly} />
                </Form.Item>
                <Form.Item name="5minRR">
                    <Input type="text" readOnly={readOnly} />
                </Form.Item>
                <Form.Item name="5minBorg">
                    <Input type="text" readOnly={readOnly} />
                </Form.Item>
                <Form.Item name="5minDistance">
                    <Input type="text" readOnly={readOnly} />
                </Form.Item>

                <Form.Item name="6minO2">
                    <Input type="text" readOnly={readOnly} />
                </Form.Item>
                <Form.Item label="6min" colon={false} />
                <Form.Item name="6minSpo2">
                    <Input type="text" readOnly={readOnly} />
                </Form.Item>
                <Form.Item name="6minHR">
                    <Input type="text" readOnly={readOnly} />
                </Form.Item>
                <Form.Item name="6minBP">
                    <Input type="text" readOnly={readOnly} />
                </Form.Item>
                <Form.Item name="6minRR">
                    <Input type="text" readOnly={readOnly} />
                </Form.Item>
                <Form.Item name="6minBorg">
                    <Input type="text" readOnly={readOnly} />
                </Form.Item>
                <Form.Item name="6minDistance">
                    <Input type="text" readOnly={readOnly} />
                </Form.Item>

                <Form.Item name="endO2">
                    <Input type="text" readOnly={readOnly} />
                </Form.Item>
                <Form.Item label="End" colon={false} />
                <Form.Item name="endSpo2">
                    <Input type="text" readOnly={readOnly} />
                </Form.Item>
                <Form.Item name="endHR">
                    <Input type="text" readOnly={readOnly} />
                </Form.Item>
                <Form.Item name="endBP">
                    <Input type="text" readOnly={readOnly} />
                </Form.Item>
                <Form.Item name="endRR">
                    <Input type="text" readOnly={readOnly} />
                </Form.Item>
                <Form.Item name="endBorg">
                    <Input type="text" readOnly={readOnly} />
                </Form.Item>
                <Form.Item name="endDistance">
                    <Input type="text" readOnly={readOnly} />
                </Form.Item>

                <Form.Item label="BMI" colon={false} />
                <Form.Item label="MHR" colon={false} />
                <Form.Item label="HR(%)" colon={false} />
                <Form.Item label="E`C" colon={false} />
                <Form.Item label="speed" colon={false} />
                <Form.Item label="Met" colon={false} />
                <Form.Item label="VO2" colon={false} />
                <Form.Item
                    label="predicted"
                    style={{ textDecoration: 'underline' }}
                    colon={false}
                />

                <Form.Item name="bmi">
                    <Input type="text" readOnly={readOnly} />
                </Form.Item>
                <Form.Item name="mhr">
                    <Input type="text" readOnly={readOnly} />
                </Form.Item>
                <Form.Item name="hr">
                    <Input type="text" readOnly={readOnly} />
                </Form.Item>
                <Form.Item name="ec">
                    <Input type="text" readOnly={readOnly} />
                </Form.Item>
                <Form.Item name="speed">
                    <Input type="text" readOnly={readOnly} />
                </Form.Item>
                <Form.Item name="met">
                    <Input type="text" readOnly={readOnly} />
                </Form.Item>
                <Form.Item name="vo2">
                    <Input type="text" readOnly={readOnly} />
                </Form.Item>
                <Form.Item name="predicteds">
                    <Input type="text" readOnly={readOnly} />
                </Form.Item>
            </Form>
        </div>
    );
};

SixMinutesTest.propTypes = {
    sixSurveyNewData: PropTypes.object,
    formInstance: PropTypes.object,
    readOnly: PropTypes.bool,
};

export default SixMinutesTest;
