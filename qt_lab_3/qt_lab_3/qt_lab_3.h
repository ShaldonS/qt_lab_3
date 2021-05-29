#pragma once

#include <QtWidgets/QWidget>
#include "ui_qt_lab_3.h"

class qt_lab_3 : public QWidget
{
    Q_OBJECT

public:
    qt_lab_3(QWidget *parent = Q_NULLPTR);

private:
    Ui::qt_lab_3Class ui;
};
