#include <QOpenGLWidget>
#include <QOpenGLFunctions_4_3_Core>
#include <QOpenGLFunctions>
#include <QOpenGLShaderProgram>

class ShaderWidget : public QOpenGLWidget 
{
private:
    QOpenGLShaderProgram m_program;
    GLfloat* vert_data;
    int m_position;
    QOpenGLFunctions_4_3_Core* functions;
    GLuint ssbo = 0;

    /*struct Sphere {
            QVector3D position;
            float radius;
            QVector3D color;
            int material_idx;
        };

    struct Camera
    {
        vec3 position;
        vec3 view;
        vec3 up;
        vec3 side;
    };

    struct Ray
    {
        vec3 origin;
        vec3 direction;
    };
    */

    /*struct Intersection
    {
        float time;
        vec3 point;
        vec3 normal;
        vec3 color;
        int material_idx;
    };*/
    
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
    /*
    buffer BufferObject
    {
        // preamble members
        int mode;
    // last member can be unsized array
    vec4 points[];
    };
    */

protected:
    void initializeGL() override;
    void resizeGL(int nWidth, int nHeight) override;
    void paintGL() override;
public:
    ShaderWidget(QWidget *parent = 0);
    ~ShaderWidget();
};

