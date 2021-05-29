#include "ShaderWidget.h"
#include <QFileInfo>

ShaderWidget::ShaderWidget(QWidget *parent) : QOpenGLWidget(parent), m_position(0)
{
	vert_data = new GLfloat[12];

	vert_data[0] = -1.0f; vert_data[1] = -1.0f; vert_data[2] = 0.0f;
	vert_data[3] = 1.0f;  vert_data[4] = -1.0f; vert_data[5] = 0.0f;
	vert_data[6] = 1.0f;  vert_data[7] = 1.0f;  vert_data[8] = 0.0f;
	vert_data[9] = -1.0f; vert_data[10] = 1.0f; vert_data[11] = 0.0f;
}

ShaderWidget::~ShaderWidget() 
{
	delete[] vert_data;
}

void ShaderWidget::initializeGL() 
{
	glClearColor(1.0f, 1.0f, 1.0f, 1.0f);
	QOpenGLShader vShader(QOpenGLShader::Vertex);
    QFileInfo info("raytracing.vert");
    qDebug() << info.absoluteFilePath();
	vShader.compileSourceFile("raytracing.vert");
	QOpenGLShader fShader(QOpenGLShader::Fragment);
	fShader.compileSourceFile("raytracing.frag");
	m_program.addShader(&vShader);
    m_program.addShader(&fShader);
    if (!m_program.link()) {
		qWarning("Error link");
		return;
	}
	m_position = m_program.attributeLocation("vertex");
	
	if (!m_program.bind()) 
	{
		qWarning("error bind programm shader");
		return;
	}

	m_program.setUniformValue("camera.position", QVector3D(0.0, 0.0, -10));
	m_program.setUniformValue("camera.view", QVector3D(0.0, 0.0, 2.0));
	m_program.setUniformValue("camera.up", QVector3D(0.0, 2.0, 0.0));
	m_program.setUniformValue("camera.side", QVector3D(2.0, 0.0, 0.0));

	m_program.setUniformValue("scale", QVector2D(width(), height()));

	m_program.release();

	std::vector<Sphere> spheres;
	spheres.push_back(Sphere{ QVector3D(1, -3, 0), 1.5, QVector3D(0.2, 0.6, 0.2), 0 });//green
	spheres.push_back(Sphere{ QVector3D(-1.5, -1.7, 2), 0.2, QVector3D(0.5, 0.1, 0.75), 0.9 });//red
    //spheres.push_back(Sphere{ QVector3D(-3, -3, 2), 0.2, QVector3D(0.5, 0.1, 0.75), 0.9 });
    //spheres.push_back(Sphere{ QVector3D(-1, 0, 1), 0.2, QVector3D(0.05, 0.4, 0.8), 0.4 });

	functions = QOpenGLContext::currentContext()->versionFunctions<QOpenGLFunctions_4_3_Core>();
	functions->glGenBuffers(1, &ssbo);
	functions->glBindBuffer(GL_SHADER_STORAGE_BUFFER, ssbo);
	functions->glBufferData(GL_SHADER_STORAGE_BUFFER, spheres.size() * sizeof(Sphere), spheres.data(), GL_DYNAMIC_COPY);
	functions->glBindBufferBase(GL_SHADER_STORAGE_BUFFER, 0, ssbo);

}

void ShaderWidget::resizeGL(int nWidth, int nHeight) 
{
	glViewport(0, 0, nWidth, nHeight);
	if (!m_program.bind()) {
		qWarning("error bind programm shader");
	}
	m_program.setUniformValue("scale", QVector2D(width(), height()));
	m_program.release();
}

void ShaderWidget::paintGL() 
{
	glClear(GL_COLOR_BUFFER_BIT);
	if (!m_program.bind())
	{
		return;
	}
	m_program.enableAttributeArray(m_position);
	m_program.setAttributeArray(m_position, vert_data, 3);
	glDrawArrays(GL_QUADS, 0, 4);
	m_program.disableAttributeArray(m_position);
	m_program.release();
}

