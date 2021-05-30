#include "ShaderWidget.h"
#include <QFileInfo>

ShaderWidget::ShaderWidget(QWidget* parent) : QOpenGLWidget(parent), m_position(0)
{
	vert_data = new GLfloat[12];

	vert_data[0] = -1.0f; vert_data[1] = -1.0f; vert_data[2] = 0.0f;
	vert_data[3] = 1.0f;  vert_data[4] = -1.0f; vert_data[5] = 0.0f;
	vert_data[6] = 1.0f;  vert_data[7] = 1.0f;  vert_data[8] = 0.0f;
	vert_data[9] = -1.0f; vert_data[10] = 1.0f; vert_data[11] = 0.0f;

	xRot = -90; yRot = 0; zRot = 0; zTra = 0; nSca = 1;

}

ShaderWidget::~ShaderWidget()
{
	delete[] vert_data;
}

void ShaderWidget::initializeGL()
{
	glClearColor(1.0f, 1.0f, 1.0f, 1.0f);
	QOpenGLShader vShader(QOpenGLShader::Vertex);
	QFileInfo info("raytracingLL.vert");
	qDebug() << info.absoluteFilePath();

	vShader.compileSourceFile("raytracingLL.vert");

	QOpenGLShader fShader(QOpenGLShader::Fragment);
	fShader.compileSourceFile("raytracingLL.frag");

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

	example_draw();
	m_program.enableAttributeArray(m_position);
	m_program.setAttributeArray(m_position, vert_data, 3);
	//glDrawArrays(GL_QUADS, 0, 4);
	m_program.disableAttributeArray(m_position);
	m_program.release();

}

void ShaderWidget::example_draw()
{

	static GLfloat pVerts[] = { -1.0f,  2.0f, 0.0f,
							  -0.5f,-2.8f, 0.0f,
							   -1.0f,  -2.0f, 0.0f,
							   1.5f,-2.8f, 0.0f,
							   1.0f,  -2.0f, 0.0f };

	glEnableClientState(GL_VERTEX_ARRAY);
	glVertexPointer(3, GL_FLOAT, 0, pVerts);

	/*glBegin(GL_TRIANGLES);
	glColor3ub(255, 0, 0); // красный
	glArrayElement(0);
	glArrayElement(1);
	glArrayElement(2);
	glColor3ub(0, 255, 0); // зеленый
	glArrayElement(1);
	glArrayElement(3);
	glArrayElement(2);
	glColor3ub(0, 0, 255); // синий
	glArrayElement(2);
	glArrayElement(3);
	glArrayElement(4);*/

	GLfloat size = 2;
	glBegin(GL_QUADS);
	glVertex3f(-size / 2, -size / 2, -size / 2);
	glVertex3f(-size / 2, size / 2, -size / 2);
	glVertex3f(-size / 2, size / 2, size / 2);
	glVertex3f(-size / 2, -size / 2, size / 2);
	// права¤ грань
	glVertex3f(size / 2, -size / 2, -size / 2);
	glVertex3f(size / 2, -size / 2, size / 2);
	glVertex3f(size / 2, size / 2, size / 2);
	glVertex3f(size / 2, size / 2, -size / 2);
	// нижн¤¤ грань
	glVertex3f(-size / 2, -size / 2, -size / 2);
	glVertex3f(-size / 2, -size / 2, size / 2);
	glVertex3f(size / 2, -size / 2, size / 2);
	glVertex3f(size / 2, -size / 2, -size / 2);
	// верхн¤¤ грань
	glVertex3f(-size / 2, size / 2, -size / 2);
	glVertex3f(-size / 2, size / 2, size / 2);
	glVertex3f(size / 2, size / 2, size / 2);
	glVertex3f(size / 2, size / 2, -size / 2);
	// задн¤¤ грань
	glVertex3f(-size / 2, -size / 2, -size / 2);
	glVertex3f(size / 2, -size / 2, -size / 2);
	glVertex3f(size / 2, size / 2, -size / 2);
	glVertex3f(-size / 2, size / 2, -size / 2);
	// передн¤¤ грань
	glVertex3f(-size / 2, -size / 2, size / 2);
	glVertex3f(size / 2, -size / 2, size / 2);
	glVertex3f(size / 2, size / 2, size / 2);
	glVertex3f(-size / 2, size / 2, size / 2);
	glEnd();
}

