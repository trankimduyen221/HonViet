/* eslint-disable */
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    Box,
    Button,
    Flex,
    FormControl,
    FormLabel,
    Heading,
    Icon,
    Input,
    InputGroup,
    InputRightElement,
    Text,
    useToast,
    Image,
    HStack,
    Center,
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    ModalCloseButton
} from "@chakra-ui/react";
import { MdOutlineRemoveRedEye } from "react-icons/md";
import { RiEyeCloseLine } from "react-icons/ri";
import axios from "axios";

import logoLotus from "../../assets/logo.jpg";
import vnFoodsImg from "../../assets/VNFoods.webp";

function LoginRegister() {
    const [isRegistering, setIsRegistering] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // STATE DÀNH CHO XÁC THỰC OTP
    const [showOtpModal, setShowOtpModal] = useState(false);
    const [otpCode, setOtpCode] = useState("");
    const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);

    const navigate = useNavigate();
    const toast = useToast();

    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [email, setEmail] = useState("");
    const [phoneNumber, setPhoneNumber] = useState("");

    const handlePasswordVisibility = () => setShowPassword(!showPassword);

    const omegaGreen = "#930a0a";
    const omegaGrayBg = "#F5F5F5";

    const systemFont = '"Comfortaa", "Quicksand", "Segoe UI", sans-serif';
    const bodyFont = '"Quicksand", sans-serif';

    // 1. XỬ LÝ BẤM NÚT ĐĂNG KÝ / ĐĂNG NHẬP
    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            if (isRegistering) {
                // ĐĂNG KÝ BƯỚC 1: Gọi API để lưu tài khoản (isVerified = false) và gửi OTP về Mail
                await axios.post("http://localhost:8080/api/users", {
                    username,
                    password,
                    email,
                    phoneNumber,
                    role: "USER"
                });

                toast({
                    title: "Mã OTP đã được gửi!",
                    description: `Vui lòng kiểm tra hộp thư ${email} để lấy mã xác thực 6 số.`,
                    status: "info",
                    position: "top",
                    duration: 4000,
                    isClosable: true,
                });

                // Mở Modal nhập OTP
                setShowOtpModal(true);
            } else {
                // ĐĂNG NHẬP
                const response = await axios.post("http://localhost:8080/api/users/login", {
                    usernameOrEmail: username,
                    password,
                });

                const token = response.data.accessToken || response.data.token;
                localStorage.setItem("accessToken", token);

                const userResponse = await axios.get("http://localhost:8080/api/users/me", {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });

                const userData = userResponse.data;
                const rawRole = userData.role || "";
                const cleanRole = rawRole.toString().toUpperCase().trim();

                localStorage.setItem("username", userData.username || username);
                localStorage.setItem("role", cleanRole);

                toast({
                    title: "Đăng nhập thành công!",
                    description: `Chào mừng ${userData.username || username} đến với Nhà Hàng Hồn Việt!`,
                    status: "success",
                    position: "top",
                    duration: 2000,
                    isClosable: true,
                });

                if (cleanRole === "ADMIN" || cleanRole.includes("ADMIN")) {
                    navigate("/admin/foods", { replace: true });
                } else if (cleanRole === "SHIPPER" || cleanRole.includes("SHIPPER") || cleanRole === "DRIVER") {
                    navigate("/client/orders", { replace: true });
                } else {
                    navigate("/client/food-menu", { replace: true });
                }
            }
        } catch (error) {
            console.error("Lỗi xác thực hệ thống:", error);
            toast({
                title: isRegistering ? "Đăng ký thất bại" : "Đăng nhập thất bại",
                description: error.response?.data?.message || error.response?.data || "Thông tin tài khoản hoặc mật khẩu chưa chính xác!",
                status: "error",
                position: "top",
                duration: 4000,
                isClosable: true,
            });
        } finally {
            setIsLoading(false);
        }
    };

    // 2. XỬ LÝ BẤM NÚT XÁC NHẬN OTP TRÊN MODAL
    const handleVerifyOtp = async (e) => {
        e.preventDefault();
        if (!otpCode || otpCode.length !== 6) {
            toast({
                title: "Mã OTP không hợp lệ",
                description: "Vui lòng nhập đúng 6 chữ số mã OTP!",
                status: "warning",
                position: "top",
                duration: 3000,
                isClosable: true,
            });
            return;
        }

        setIsVerifyingOtp(true);
        try {
            await axios.post("http://localhost:8080/api/users/verify-otp", {
                email: email,
                otp: otpCode,
            });

            toast({
                title: "Kích hoạt tài khoản thành công!",
                description: "Tài khoản của bạn đã được xác thực thành công. Mời bạn đăng nhập!",
                status: "success",
                position: "top",
                duration: 3000,
                isClosable: true,
            });

            // Tắt Modal OTP, chuyển về form Đăng nhập
            setShowOtpModal(false);
            setIsRegistering(false);
            setPassword("");
            setOtpCode("");
        } catch (error) {
            toast({
                title: "Xác thực thất bại",
                description: error.response?.data?.message || error.response?.data || "Mã OTP không chính xác hoặc đã hết hạn!",
                status: "error",
                position: "top",
                duration: 3000,
                isClosable: true,
            });
        } finally {
            setIsVerifyingOtp(false);
        }
    };

    return (
        <Box bg="white" minH="100vh">
            <link href="https://fonts.googleapis.com/css2?family=Comfortaa:wght@700;900&family=Oswald:wght@500;700&family=Quicksand:wght@600;700;900&display=swap" rel="stylesheet" />

            <Box bg={omegaGreen} color="white" py="10px" textAlign="center" fontSize="13px" fontWeight="bold" letterSpacing="1.5px" fontFamily={bodyFont}>
                HỒN VIỆT — MỸ VỊ CHÍNH THỐNG ĐẬM ĐÀ QUÊ HƯƠNG
            </Box>

            <Box bg="white" borderBottom="1px solid #EDEDED" py="12px" px={{ base: '15px', md: '30px' }} position="sticky" top="0" zIndex="10">
                <Flex maxW="1400px" mx="auto" align="center" justify="space-between">
                    <HStack spacing="12px" cursor="pointer" onClick={() => navigate("/")}>
                        <Image src={logoLotus} alt="Hon Viet Logo" boxSize="50px" objectFit="contain" />
                        <Box display={{ base: 'none', sm: 'block' }}>
                            <Text fontSize="18px" fontFamily={systemFont} fontWeight="900" color={omegaGreen} letterSpacing="0.5px" lineHeight="none">
                                HỒN VIỆT
                            </Text>
                            <Text fontSize="9px" color="gray.500" fontWeight="bold" letterSpacing="0.5px" mt="2px" fontFamily={bodyFont}>
                                SINCE 2026
                            </Text>
                        </Box>
                    </HStack>

                    <HStack spacing="20px">
                        <HStack spacing="8px" display={{ base: 'none', md: 'flex' }}>
                            <Text fontSize="20px">📞</Text>
                            <Box fontFamily={bodyFont}>
                                <Text fontSize="11px" color="gray.500" fontWeight="600" mb="-3px">Liên hệ đặt món</Text>
                                <Text fontSize="15px" fontWeight="800" color={omegaGreen}>1900 55 88 50</Text>
                            </Box>
                        </HStack>
                    </HStack>
                </Flex>
            </Box>

            <Box bg={omegaGrayBg} py="10px" px={{ base: '15px', md: '30px' }}>
                <HStack maxW="1400px" mx="auto" fontSize="12px" color="gray.500" fontWeight="600" fontFamily={bodyFont}>
                    <Text cursor="pointer" onClick={() => navigate("/")}>Trang chủ</Text>
                    <Text>/</Text>
                    <Text color="gray.800">{isRegistering ? "Đăng ký thành viên" : "Đăng nhập hệ thống"}</Text>
                </HStack>
            </Box>

            <Center p={{ base: "40px 15px", md: "60px 30px" }} minH="50vh">
                <Box maxW="460px" w="100%" p={{ base: "30px 20px", md: "40px" }} borderRadius="12px" boxShadow="0 10px 30px rgba(0, 0, 0, 0.04)" border="1px solid #EAEAEA">
                    <Box mb="32px" textAlign="center">
                        <Heading color="#222222" fontSize="24px" fontWeight="900" mb="10px" textTransform="uppercase" fontFamily={systemFont} letterSpacing="0.5px">
                            {isRegistering ? "ĐĂNG KÝ THÀNH VIÊN" : "ĐĂNG NHẬP"}
                        </Heading>
                        <Text color="gray.400" fontSize="11px" fontWeight="800" fontFamily={bodyFont} letterSpacing="0.5px">
                            HỒN VIỆT RESTAURANT — MỸ VỊ CHÍNH THỐNG
                        </Text>
                    </Box>

                    <FormControl as="form" onSubmit={handleSubmit}>
                        <FormLabel fontSize="11px" fontWeight="800" color="gray.600" mb="6px" textTransform="uppercase" fontFamily={bodyFont}>
                            Tên tài khoản (đăng nhập) <Text as="span" color="red.500">*</Text>
                        </FormLabel>
                        <Input
                            isRequired
                            variant="outline"
                            focusBorderColor={omegaGreen}
                            fontSize="13px"
                            type="text"
                            placeholder="Nhập tên tài khoản của bạn..."
                            mb="18px"
                            fontWeight="700"
                            size="lg"
                            borderRadius="6px"
                            h="45px"
                            fontFamily={bodyFont}
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                        />

                        {isRegistering && (
                            <>
                                <FormLabel fontSize="11px" fontWeight="800" color="gray.600" mb="6px" textTransform="uppercase" fontFamily={bodyFont}>
                                    Hộp thư Email <Text as="span" color="red.500">*</Text>
                                </FormLabel>
                                <Input
                                    isRequired
                                    variant="outline"
                                    focusBorderColor={omegaGreen}
                                    fontSize="13px"
                                    type="email"
                                    placeholder="mail@example.com"
                                    mb="18px"
                                    fontWeight="700"
                                    size="lg"
                                    borderRadius="6px"
                                    h="45px"
                                    fontFamily={bodyFont}
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />

                                <FormLabel fontSize="11px" fontWeight="800" color="gray.600" mb="6px" textTransform="uppercase" fontFamily={bodyFont}>
                                    Số điện thoại liên lạc <Text as="span" color="red.500">*</Text>
                                </FormLabel>
                                <Input
                                    isRequired
                                    variant="outline"
                                    focusBorderColor={omegaGreen}
                                    fontSize="13px"
                                    type="tel"
                                    placeholder="Nhập số điện thoại nhận hàng..."
                                    mb="18px"
                                    fontWeight="700"
                                    size="lg"
                                    borderRadius="6px"
                                    h="45px"
                                    fontFamily={bodyFont}
                                    value={phoneNumber}
                                    onChange={(e) => setPhoneNumber(e.target.value)}
                                />
                            </>
                        )}

                        <FormLabel fontSize="11px" fontWeight="800" color="gray.600" mb="6px" textTransform="uppercase" fontFamily={bodyFont}>
                            Mật khẩu <Text as="span" color="red.500">*</Text>
                        </FormLabel>
                        <InputGroup size="lg" mb="28px">
                            <Input
                                isRequired
                                variant="outline"
                                focusBorderColor={omegaGreen}
                                fontSize="13px"
                                placeholder="Nhập mật khẩu..."
                                borderRadius="6px"
                                fontWeight="700"
                                h="45px"
                                fontFamily={bodyFont}
                                type={showPassword ? "text" : "password"}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                            <InputRightElement display="flex" alignItems="center" h="100%">
                                <Icon
                                    color="gray.400"
                                    fontSize="18px"
                                    _hover={{ cursor: "pointer", color: omegaGreen }}
                                    as={showPassword ? RiEyeCloseLine : MdOutlineRemoveRedEye}
                                    onClick={handlePasswordVisibility}
                                />
                            </InputRightElement>
                        </InputGroup>

                        <Button
                            fontSize="13px"
                            bg={omegaGreen}
                            color="white"
                            _hover={{ bg: "#760808" }}
                            fontWeight="800"
                            w="100%"
                            h="45px"
                            mb="15px"
                            borderRadius="4px"
                            type="submit"
                            fontFamily={bodyFont}
                            isLoading={isLoading}
                        >
                            {isRegistering ? "ĐĂNG KÝ NGAY" : "ĐĂNG NHẬP"}
                        </Button>
                    </FormControl>

                    <Box mt="15px" textAlign="center">
                        <Text color="gray.500" fontSize="13px" fontWeight="600" fontFamily={bodyFont}>
                            {isRegistering ? "Bạn đã có tài khoản?" : "Chưa có tài khoản?"}
                            <Text
                                color={omegaGreen}
                                as="span"
                                ms="6px"
                                fontWeight="800"
                                _hover={{ cursor: "pointer", textDecoration: "underline" }}
                                onClick={() => {
                                    setIsRegistering(!isRegistering);
                                    setUsername("");
                                    setPassword("");
                                    setEmail("");
                                    setPhoneNumber("");
                                }}
                            >
                                {isRegistering ? "Quay lại Đăng nhập" : "Đăng ký tại đây"}
                            </Text>
                        </Text>
                    </Box>
                </Box>
            </Center>

            {/* MODAL BẬT LÊN ĐỂ NHẬP MÃ OTP */}
            <Modal isOpen={showOtpModal} onClose={() => setShowOtpModal(false)} isCentered closeOnOverlayClick={false}>
                <ModalOverlay bg="blackAlpha.600" backdropFilter="blur(2px)" />
                <ModalContent borderRadius="12px" p="10px">
                    <ModalHeader textAlign="center" fontSize="18px" fontWeight="900" color={omegaGreen} fontFamily={systemFont}>
                        XÁC THỰC MÃ OTP
                    </ModalHeader>
                    <ModalCloseButton />
                    <ModalBody textAlign="center">
                        <Text fontSize="13px" color="gray.600" fontWeight="600" fontFamily={bodyFont} mb="5px">
                            Mã xác thực 6 số đã được gửi tới email:
                        </Text>
                        <Text fontSize="14px" fontWeight="800" color="gray.800" fontFamily={bodyFont} mb="15px">
                            {email}
                        </Text>

                        <FormControl as="form" onSubmit={handleVerifyOtp}>
                            <Input
                                isRequired
                                maxLength={6}
                                placeholder="000000"
                                textAlign="center"
                                fontSize="24px"
                                fontWeight="900"
                                letterSpacing="6px"
                                focusBorderColor={omegaGreen}
                                h="50px"
                                mb="10px"
                                fontFamily={bodyFont}
                                value={otpCode}
                                onChange={(e) => setOtpCode(e.target.value)}
                            />
                            <Text fontSize="11px" color="gray.400" fontWeight="600" fontFamily={bodyFont} mb="20px">
                                Mã có hiệu lực trong vòng 5 phút
                            </Text>

                            <Button
                                bg={omegaGreen}
                                color="white"
                                _hover={{ bg: "#760808" }}
                                w="100%"
                                h="45px"
                                fontWeight="800"
                                fontSize="13px"
                                type="submit"
                                fontFamily={bodyFont}
                                isLoading={isVerifyingOtp}
                            >
                                XÁC NHẬN MÃ OTP
                            </Button>
                        </FormControl>
                    </ModalBody>
                    <ModalFooter justifyContent="center">
                        <Button variant="ghost" size="sm" onClick={() => setShowOtpModal(false)} color="gray.500" fontSize="12px" fontFamily={bodyFont}>
                            Hủy bỏ / Đăng ký lại
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>

            <Box bg="white" borderTop="1px solid #EAEAEA" borderBottom="1px solid #EAEAEA" py="20px" px="20px" mt="auto">
                <Flex maxW="1400px" mx="auto" direction={{ base: 'column', md: 'row' }} justify="center" align="center" gap="10px">
                    <HStack color="#333333" fontSize="12px" fontWeight="800" spacing="6px" fontFamily={bodyFont}>
                        <Text letterSpacing="0.5px" whiteSpace="nowrap">KẾT NỐI VỚI CHÚNG TÔI:</Text>
                    </HStack>
                    <HStack spacing="8px">
                        <Center w="32px" h="32px" bg={omegaGreen} color="white" cursor="pointer" _hover={{ opacity: 0.9 }}>f</Center>
                        <Center w="32px" h="32px" bg={omegaGreen} color="white" cursor="pointer" _hover={{ opacity: 0.9 }}>ig</Center>
                        <Center w="32px" h="32px" bg={omegaGreen} color="white" cursor="pointer" _hover={{ opacity: 0.9 }}>yt</Center>
                    </HStack>
                </Flex>
            </Box>

            <Box bg="white" py="30px" px={{ base: '20px', md: '40px' }}>
                <Flex maxW="1400px" mx="auto" direction="column" align="center">
                    <Box textAlign="center" fontSize="11px" color="gray.400" fontWeight="bold" fontFamily={bodyFont}>
                        Copyright © 2026 honvietfoods. Powered by Yuri Project
                    </Box>
                </Flex>
            </Box>
        </Box>
    );
}

export default LoginRegister;