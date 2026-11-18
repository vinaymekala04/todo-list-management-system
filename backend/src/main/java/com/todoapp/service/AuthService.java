package com.todoapp.service;

import com.todoapp.dto.AuthResponse;
import com.todoapp.dto.ChangePasswordRequest;
import com.todoapp.dto.LoginRequest;
import com.todoapp.dto.ProfileResponse;
import com.todoapp.dto.RegisterRequest;
import com.todoapp.entity.User;
import com.todoapp.exception.ResourceNotFoundException;
import com.todoapp.repository.UserRepository;
import com.todoapp.security.CustomUserDetails;
import com.todoapp.security.JwtUtil;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtUtil jwtUtil;

    public AuthService(UserRepository userRepository, PasswordEncoder passwordEncoder,
                       AuthenticationManager authenticationManager, JwtUtil jwtUtil) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.authenticationManager = authenticationManager;
        this.jwtUtil = jwtUtil;
    }

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("Email is already registered");
        }
        User user = new User(
                request.getName().trim(),
                request.getEmail().trim().toLowerCase(),
                passwordEncoder.encode(request.getPassword()));
        user = userRepository.save(user);
        String token = jwtUtil.generateToken(new CustomUserDetails(user));
        return new AuthResponse(token, user.getId(), user.getName(), user.getEmail());
    }

    public AuthResponse login(LoginRequest request) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.getEmail().trim().toLowerCase(), request.getPassword()));
        CustomUserDetails userDetails = (CustomUserDetails) authentication.getPrincipal();
        String token = jwtUtil.generateToken(userDetails);
        User user = userDetails.getUser();
        return new AuthResponse(token, user.getId(), user.getName(), user.getEmail());
    }

    /** Returns the currently authenticated user; throws 404 if none is found. */
    public User getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !(authentication.getPrincipal() instanceof CustomUserDetails details)) {
            throw new ResourceNotFoundException("Authenticated user not found");
        }
        return details.getUser();
    }

    public ProfileResponse getProfile() {
        return ProfileResponse.fromEntity(getCurrentUser());
    }

    @Transactional
    public void changePassword(ChangePasswordRequest request) {
        User user = getCurrentUser();
        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) {
            throw new IllegalArgumentException("Current password is incorrect");
        }
        if (passwordEncoder.matches(request.getNewPassword(), user.getPassword())) {
            throw new IllegalArgumentException("New password must be different from the current password");
        }
        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
    }
}
