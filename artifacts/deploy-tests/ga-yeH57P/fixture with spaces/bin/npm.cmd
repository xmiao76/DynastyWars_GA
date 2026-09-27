@echo off
echo npm %*>> "%DW_DEPLOY_TEST_LOG%"
if "%DW_DEPLOY_TEST_FAIL%"=="%*" exit /b 9
exit /b 0
