#include <QOpenGLWidget>
#include <QGLWidget>
#include <QOpenGLFunctions_4_3_Core>
#include <QOpenGLFunctions>
#include <QOpenGLShaderProgram>
#include <QtGui> 

class ShaderWidget : public QOpenGLWidget
{
private:
    QOpenGLShaderProgram m_program;
    GLfloat* vert_data;
    int m_position;
    QOpenGLFunctions_4_3_Core* functions;
    GLuint ssbo = 0;

    struct Material
    {
        float ambient;
        float diffuse;
        float specular;
        float specular_power;
    };

    Material material = { 0.4, 0.9, 0.0, 512.0 };

    struct Sphere
    {
        QVector3D position;
        float radius;
        QVector3D color;
        double material_idx;
    };



protected:

    void example_draw();
    void initializeGL() override;
    void resizeGL(int nWidth, int nHeight) override;
    void paintGL() override;

public:
    ShaderWidget(QWidget* parent = 0);
    ~ShaderWidget();
};


