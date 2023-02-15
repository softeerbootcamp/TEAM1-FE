package com.tdd.backend.post.data;

import javax.validation.constraints.NotBlank;

import lombok.Builder;
import lombok.Getter;

@Getter
public class PostDto {
	@NotBlank(message = "car name은 필수입니다!")
	private final String carName;
	@NotBlank(message = "ride option은 필수입니다!")
	private final String rideOption;
	private final String requirement;

	@Builder
	public PostDto(String carName, String rideOption, String requirement) {
		this.carName = carName;
		this.rideOption = rideOption;
		this.requirement = requirement;
	}
}
