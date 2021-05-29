#include "qt_lab_3.h"
#include "ShaderWidget.h"
#include <QApplication>
#include <QSurfaceFormat>
#pragma comment (lib, "opengl32.lib")

int main(int argc, char* argv[])
{
    QApplication a(argc, argv);
    ShaderWidget w(NULL);
    w.show();
    return a.exec();
}

