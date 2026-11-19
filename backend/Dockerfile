# Todo List Management System — backend (Spring Boot)
# Multi-stage build: Maven builds the jar, then a slim JRE image runs it.
# Render sets $PORT automatically; application.properties reads server.port=${PORT:8080}.
# Build with: docker build -t todo-backend ./backend
# Run with:  docker run -p 8080:8080 -e DB_URL=... -e DB_USERNAME=... -e DB_PASSWORD=... todo-backend

FROM maven:3.9.9-eclipse-temurin-17 AS build
WORKDIR /app
COPY pom.xml .
COPY src ./src
RUN mvn -q -DskipTests package

FROM eclipse-temurin:17-jre
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar
EXPOSE 8080
# Low-memory JVM flags: Render's free tier has 512 MB RAM.
ENTRYPOINT ["java", "-Xmx384m", "-Xms128m", "-jar", "app.jar"]
